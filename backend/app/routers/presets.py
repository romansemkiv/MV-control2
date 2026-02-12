import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.preset import Preset
from app.schemas.preset import PresetCreate, PresetResponse, PresetDetail, ApplyPresetRequest

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.get("", response_model=list[PresetResponse])
def list_presets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    presets = db.query(Preset).filter(Preset.user_id == user.id).order_by(Preset.created_at.desc()).all()
    return [PresetResponse(id=p.id, name=p.name, created_at=str(p.created_at)) for p in presets]


@router.post("", response_model=PresetResponse)
def create_preset(body: PresetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = Preset(user_id=user.id, name=body.name, payload_json=json.dumps(body.payload))
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return PresetResponse(id=preset.id, name=preset.name, created_at=str(preset.created_at))


@router.get("/{preset_id}", response_model=PresetDetail)
def get_preset(preset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return PresetDetail(id=preset.id, name=preset.name, payload=json.loads(preset.payload_json), created_at=str(preset.created_at))


@router.delete("/{preset_id}")
def delete_preset(preset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    db.delete(preset)
    db.commit()
    return {"ok": True}


@router.post("/{preset_id}/apply")
def apply_preset(preset_id: int, body: ApplyPresetRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    from app.services.integration import get_nexx_client, get_quartz_client
    from app.models.multiviewer import Multiviewer
    from app.protocol_mappings import (
        VARID_MV_LAYOUT, VARID_MV_FONT, VARID_MV_OUTPUT_FORMAT,
        VARID_MV_OUTER_BORDER, VARID_MV_INNER_BORDER,
        VARID_PCM_BARS, UMD_VARIDS, pcm_value_to_index,
    )

    payload = json.loads(preset.payload_json)
    cats = set(body.categories)

    # Support both old format (single MV) and new format (multi-MV)
    mvs_data = payload.get("mvs")
    if mvs_data is None:
        # Legacy single-MV format
        mvs_data = [{"mv_nexx_index": payload.get("mv_nexx_index"), **payload.get("params", {})}]

    nexx = None
    quartz = None

    for saved_mv in mvs_data:
        src_idx = str(saved_mv.get("mv_nexx_index"))
        target_mv_id = body.targets.get(src_idx)
        if target_mv_id is None:
            continue

        target_mv = db.query(Multiviewer).filter(Multiviewer.id == target_mv_id).first()
        if not target_mv:
            continue
        tgt_idx = target_mv.nexx_index

        # NEXX params
        if cats & {"layout", "mv_params", "umd", "pcm"}:
            if not nexx:
                nexx = get_nexx_client(db)
            if not nexx:
                raise HTTPException(status_code=503, detail="NEXX not configured")

        if "layout" in cats and "layout" in saved_mv:
            nexx.set_parameter(f"{VARID_MV_LAYOUT}.{tgt_idx}", str(saved_mv["layout"]))
        if "mv_params" in cats:
            for key, varid in [("font", VARID_MV_FONT), ("output_format", VARID_MV_OUTPUT_FORMAT),
                               ("outer_border", VARID_MV_OUTER_BORDER), ("inner_border", VARID_MV_INNER_BORDER)]:
                if key in saved_mv:
                    nexx.set_parameter(f"{varid}.{tgt_idx}", str(saved_mv[key]))

        for win in saved_mv.get("windows", []):
            win_idx = win.get("index")
            if win_idx is None:
                continue
            if "pcm" in cats and "pcm_bars" in win:
                pcm_index = pcm_value_to_index(win["pcm_bars"])
                nexx.set_parameter(f"{VARID_PCM_BARS}.{tgt_idx}.{win_idx}", str(pcm_index))
            if "umd" in cats:
                for layer_idx, layer_data in enumerate(win.get("umd", [])):
                    for varid_base, value in layer_data.items():
                        if varid_base in UMD_VARIDS:
                            nexx.set_parameter(f"{varid_base}.{tgt_idx}.{win_idx}.{layer_idx}", str(value))
            if "sources" in cats and "source_input" in win and win["source_input"] is not None:
                if not quartz:
                    quartz = get_quartz_client(db)
                if quartz:
                    output = tgt_idx * 16 + win_idx + 1
                    quartz.switch(output, win["source_input"])

    return {"ok": True}


@router.get("/{preset_id}/export")
def export_preset(preset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    data = {"name": preset.name, "payload": json.loads(preset.payload_json)}
    return JSONResponse(content=data, headers={"Content-Disposition": f'attachment; filename="{preset.name}.json"'})


@router.post("/import")
async def import_preset(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    content = await file.read()
    data = json.loads(content)
    preset = Preset(user_id=user.id, name=data.get("name", "Imported"), payload_json=json.dumps(data.get("payload", {})))
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return PresetResponse(id=preset.id, name=preset.name, created_at=str(preset.created_at))
