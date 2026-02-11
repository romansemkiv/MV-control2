import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.multiviewer import Multiviewer, UserAccessMV
from app.models.state import StateMV, StateWindow
from app.schemas.mv import MultiviewerResponse, MVStateResponse, SetLayoutRequest, SetMVParamsRequest, SetWindowRequest
from app.services.integration import get_nexx_client
from app.protocol_mappings import (
    VARID_MV_LAYOUT, VARID_MV_FONT, VARID_MV_OUTER_BORDER, VARID_MV_INNER_BORDER,
    VARID_MV_OUTPUT_FORMAT, VARID_PCM_BARS, UMD_VARIDS, pcm_value_to_index,
)

router = APIRouter(prefix="/api/multiviewers", tags=["multiviewers"])


def _check_mv_access(user: User, mv: Multiviewer, db: Session):
    if user.role == "admin":
        return
    access = db.query(UserAccessMV).filter(
        UserAccessMV.user_id == user.id, UserAccessMV.mv_id == mv.id
    ).first()
    if not access:
        raise HTTPException(status_code=403, detail="No access to this multiviewer")


@router.get("", response_model=list[MultiviewerResponse])
def list_multiviewers(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "admin":
        mvs = db.query(Multiviewer).order_by(Multiviewer.nexx_index).all()
    else:
        allowed = db.query(UserAccessMV.mv_id).filter(UserAccessMV.user_id == user.id).subquery()
        mvs = db.query(Multiviewer).filter(Multiviewer.id.in_(allowed)).order_by(Multiviewer.nexx_index).all()
    return [MultiviewerResponse(id=m.id, nexx_index=m.nexx_index, label=m.label, enabled=m.enabled) for m in mvs]


@router.get("/{mv_id}", response_model=MVStateResponse)
def get_multiviewer(mv_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mv = db.query(Multiviewer).filter(Multiviewer.id == mv_id).first()
    if not mv:
        raise HTTPException(status_code=404, detail="Multiviewer not found")
    _check_mv_access(user, mv, db)

    state = db.query(StateMV).filter(StateMV.mv_id == mv.id).first()
    windows_db = db.query(StateWindow).filter(StateWindow.mv_id == mv.id).order_by(StateWindow.window_index).all()
    windows = []
    for w in windows_db:
        umd = json.loads(w.umd_json) if w.umd_json else []
        windows.append({"window_index": w.window_index, "pcm_bars": w.pcm_bars, "umd": umd})

    return MVStateResponse(
        id=mv.id,
        nexx_index=mv.nexx_index,
        label=mv.label,
        layout=state.layout if state else None,
        font=state.font if state else None,
        outer_border=state.outer_border if state else None,
        inner_border=state.inner_border if state else None,
        output_format=state.output_format if state else None,
        windows=windows,
    )


@router.post("/{mv_id}/layout")
def set_layout(mv_id: int, body: SetLayoutRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mv = db.query(Multiviewer).filter(Multiviewer.id == mv_id).first()
    if not mv:
        raise HTTPException(status_code=404, detail="Multiviewer not found")
    _check_mv_access(user, mv, db)

    nexx = get_nexx_client(db)
    if not nexx:
        raise HTTPException(status_code=503, detail="NEXX not configured")

    nexx.set_parameter(f"{VARID_MV_LAYOUT}.{mv.nexx_index}", str(body.layout))

    state = db.query(StateMV).filter(StateMV.mv_id == mv.id).first()
    if state:
        state.layout = body.layout
        db.commit()

    return {"ok": True}


@router.post("/{mv_id}/params")
def set_mv_params(mv_id: int, body: SetMVParamsRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mv = db.query(Multiviewer).filter(Multiviewer.id == mv_id).first()
    if not mv:
        raise HTTPException(status_code=404, detail="Multiviewer not found")
    _check_mv_access(user, mv, db)

    nexx = get_nexx_client(db)
    if not nexx:
        raise HTTPException(status_code=503, detail="NEXX not configured")

    state = db.query(StateMV).filter(StateMV.mv_id == mv.id).first()

    param_map = {
        "font": (VARID_MV_FONT, body.font),
        "outer_border": (VARID_MV_OUTER_BORDER, body.outer_border),
        "inner_border": (VARID_MV_INNER_BORDER, body.inner_border),
        "output_format": (VARID_MV_OUTPUT_FORMAT, body.output_format),
    }

    for attr, (varid, value) in param_map.items():
        if value is not None:
            nexx.set_parameter(f"{varid}.{mv.nexx_index}", str(value))
            if state:
                setattr(state, attr, value)

    if state:
        db.commit()

    return {"ok": True}


@router.post("/{mv_id}/windows/{window_index}")
def set_window(mv_id: int, window_index: int, body: SetWindowRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mv = db.query(Multiviewer).filter(Multiviewer.id == mv_id).first()
    if not mv:
        raise HTTPException(status_code=404, detail="Multiviewer not found")
    _check_mv_access(user, mv, db)

    nexx = get_nexx_client(db)
    if not nexx:
        raise HTTPException(status_code=503, detail="NEXX not configured")

    if body.pcm_bars is not None:
        pcm_index = pcm_value_to_index(body.pcm_bars)
        nexx.set_parameter(f"{VARID_PCM_BARS}.{mv.nexx_index}.{window_index}", str(pcm_index))

    win_state = db.query(StateWindow).filter(
        StateWindow.mv_id == mv.id, StateWindow.window_index == window_index
    ).first()

    if body.umd is not None:
        # Merge incoming UMD data with existing data to avoid wiping unchanged layers
        existing_umd = json.loads(win_state.umd_json) if win_state and win_state.umd_json else [{}, {}, {}]
        while len(existing_umd) < 3:
            existing_umd.append({})

        for layer_idx, layer_data in enumerate(body.umd):
            if layer_idx > 2:
                break
            if layer_data:
                existing_umd[layer_idx].update(layer_data)
            for varid_base, value in layer_data.items():
                if varid_base in UMD_VARIDS:
                    nexx.set_parameter(f"{varid_base}.{mv.nexx_index}.{window_index}.{layer_idx}", str(value))

    if win_state:
        if body.pcm_bars is not None:
            win_state.pcm_bars = body.pcm_bars
        if body.umd is not None:
            win_state.umd_json = json.dumps(existing_umd)
        db.commit()

    return {"ok": True}
