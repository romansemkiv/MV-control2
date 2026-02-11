from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.services.integration import get_nexx_client, get_quartz_client
from app.services.state import refresh_nexx_state, refresh_quartz_state

router = APIRouter(prefix="/api", tags=["refresh"])

_last_refresh: dict = {}


@router.post("/refresh")
def do_refresh(admin=Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    user_id = admin.id

    last = _last_refresh.get(user_id)
    if last and (now - last).total_seconds() < 60:
        raise HTTPException(status_code=429, detail="Refresh throttled. Try again later.")

    results = {"nexx": None, "quartz": None, "timestamp": now.isoformat(), "errors": []}

    nexx = get_nexx_client(db)
    if nexx:
        try:
            results["nexx"] = refresh_nexx_state(db, nexx)
        except Exception as e:
            results["errors"].append(f"NEXX error: {str(e)}")
            results["nexx"] = {"error": str(e)}

    quartz = get_quartz_client(db)
    if quartz:
        try:
            from app.models.integration import Integration
            quartz_integration = db.query(Integration).filter(Integration.protocol == "quartz").first()
            max_inputs = quartz_integration.max_inputs if quartz_integration and quartz_integration.max_inputs else 960
            max_outputs = quartz_integration.max_outputs if quartz_integration and quartz_integration.max_outputs else 960
            results["quartz"] = refresh_quartz_state(db, quartz, max_sources=max_inputs, max_outputs=max_outputs)
        except Exception as e:
            results["errors"].append(f"Quartz error: {str(e)}")
            results["quartz"] = {"error": str(e)}

    if not nexx and not quartz:
        raise HTTPException(status_code=400, detail="No integrations configured. Please configure Quartz and/or NEXX in Admin → Integrations.")

    _last_refresh[user_id] = now
    return results


@router.get("/system/status")
def system_status(admin=Depends(require_admin)):
    if not _last_refresh:
        return {"last_refresh": None}
    latest_user = max(_last_refresh, key=_last_refresh.get)
    return {"last_refresh": _last_refresh[latest_user].isoformat()}
