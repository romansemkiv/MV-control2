import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.preset import Preset
from app.schemas.preset import PresetCreate, PresetResponse, PresetDetail

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
def apply_preset(preset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preset = db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user.id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    from app.services.integration import get_nexx_client
    from app.services.state import VARID_MV_LAYOUT, VARID_MV_FONT, VARID_MV_OUTER_BORDER, VARID_MV_INNER_BORDER, VARID_PCM_BARS, UMD_VARIDS

    nexx = get_nexx_client(db)
    if not nexx:
        raise HTTPException(status_code=503, detail="NEXX not configured")

    payload = json.loads(preset.payload_json)
    mv_idx = payload.get("mv_nexx_index")
    if mv_idx is None:
        raise HTTPException(status_code=400, detail="Preset missing mv_nexx_index")

    params = payload.get("params", {})

    if "layout" in params:
        nexx.set_parameter(f"{VARID_MV_LAYOUT}.{mv_idx}", str(params["layout"]))
    if "font" in params:
        nexx.set_parameter(f"{VARID_MV_FONT}.{mv_idx}", str(params["font"]))
    if "outer_border" in params:
        nexx.set_parameter(f"{VARID_MV_OUTER_BORDER}.{mv_idx}", str(params["outer_border"]))
    if "inner_border" in params:
        nexx.set_parameter(f"{VARID_MV_INNER_BORDER}.{mv_idx}", str(params["inner_border"]))

    for win in params.get("windows", []):
        win_idx = win.get("index")
        if win_idx is None:
            continue
        if "pcm_bars" in win:
            nexx.set_parameter(f"{VARID_PCM_BARS}.{mv_idx}.{win_idx}", str(win["pcm_bars"]))
        for layer_idx, layer_data in enumerate(win.get("umd", [])):
            for varid_base, value in layer_data.items():
                if varid_base in UMD_VARIDS:
                    nexx.set_parameter(f"{varid_base}.{mv_idx}.{win_idx}.{layer_idx}", str(value))

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
