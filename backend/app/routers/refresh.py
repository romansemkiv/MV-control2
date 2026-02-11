import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.state import RefreshStatus
from app.models.multiviewer import Multiviewer, UserAccessMV
from app.models.source import Source, UserAccessSource
from app.services.integration import get_nexx_client, get_quartz_client
from app.services.state import refresh_nexx_state, refresh_quartz_state

router = APIRouter(prefix="/api", tags=["refresh"])

THROTTLE_SECONDS = 60


def _get_or_create_status(db: Session) -> RefreshStatus:
    status = db.query(RefreshStatus).filter(RefreshStatus.id == 1).first()
    if not status:
        status = RefreshStatus(id=1, is_running=False)
        db.add(status)
        db.commit()
    return status


@router.post("/refresh")
def do_refresh(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    status = _get_or_create_status(db)

    if status.is_running:
        raise HTTPException(status_code=423, detail="Refresh is already in progress.")

    finished = status.finished_at.replace(tzinfo=timezone.utc) if status.finished_at and status.finished_at.tzinfo is None else status.finished_at
    if finished and (now - finished).total_seconds() < THROTTLE_SECONDS:
        raise HTTPException(status_code=429, detail="Refresh throttled. Try again later.")

    status.is_running = True
    status.started_at = now
    status.started_by = user.login
    db.commit()

    results = {"nexx": None, "quartz": None, "timestamp": now.isoformat(), "errors": []}

    try:
        mv_indices = None
        source_inputs = None
        output_range = None

        if user.role != "admin":
            mv_ids = [r.mv_id for r in db.query(UserAccessMV.mv_id).filter(UserAccessMV.user_id == user.id).all()]
            mvs = db.query(Multiviewer).filter(Multiviewer.id.in_(mv_ids)).all() if mv_ids else []
            mv_indices = [mv.nexx_index for mv in mvs]

            outputs = []
            for idx in mv_indices:
                outputs.extend(range(idx * 16 + 1, idx * 16 + 17))
            output_range = outputs if outputs else []

            src_ids = [r.source_id for r in db.query(UserAccessSource.source_id).filter(UserAccessSource.user_id == user.id).all()]
            sources = db.query(Source).filter(Source.id.in_(src_ids)).all() if src_ids else []
            source_inputs = [s.quartz_input for s in sources]

        nexx = get_nexx_client(db)
        if nexx:
            try:
                results["nexx"] = refresh_nexx_state(db, nexx, mv_indices=mv_indices)
            except Exception as e:
                results["errors"].append(f"NEXX error: {str(e)}")
                results["nexx"] = {"error": str(e)}

        quartz = get_quartz_client(db)
        if quartz:
            try:
                from app.models.integration import Integration
                qi = db.query(Integration).filter(Integration.protocol == "quartz").first()
                max_inputs = qi.max_inputs if qi and qi.max_inputs else 960
                max_outputs = qi.max_outputs if qi and qi.max_outputs else 960
                results["quartz"] = refresh_quartz_state(
                    db, quartz, max_sources=max_inputs, max_outputs=max_outputs,
                    source_inputs=source_inputs, output_range=output_range,
                )
            except Exception as e:
                results["errors"].append(f"Quartz error: {str(e)}")
                results["quartz"] = {"error": str(e)}

        if not nexx and not quartz:
            raise HTTPException(status_code=400, detail="No integrations configured. Please configure Quartz and/or NEXX in Admin → Integrations.")

    finally:
        status.is_running = False
        status.finished_at = datetime.now(timezone.utc)
        status.result_json = json.dumps(results)
        db.commit()

    return results


@router.get("/refresh/status")
def refresh_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    status = _get_or_create_status(db)
    return {
        "is_running": status.is_running,
        "started_at": status.started_at.isoformat() if status.started_at else None,
        "started_by": status.started_by,
        "finished_at": status.finished_at.isoformat() if status.finished_at else None,
        "result": json.loads(status.result_json) if status.result_json else None,
    }
