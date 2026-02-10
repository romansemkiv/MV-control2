from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.state import StateRouting
from app.schemas.mv import SwitchRequest, RoutingEntry
from app.services.integration import get_quartz_client

router = APIRouter(prefix="/api/routing", tags=["routing"])


@router.get("", response_model=list[RoutingEntry])
def get_routing(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routes = db.query(StateRouting).order_by(StateRouting.output).all()
    return [RoutingEntry(output=r.output, input=r.input) for r in routes]


@router.post("/switch")
def switch_route(body: SwitchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quartz = get_quartz_client(db)
    if not quartz:
        raise HTTPException(status_code=503, detail="Quartz not configured")

    quartz.switch(body.output, body.input)

    route = db.query(StateRouting).filter(StateRouting.output == body.output).first()
    if route:
        route.input = body.input
        route.updated_at = datetime.now(timezone.utc)
    else:
        route = StateRouting(output=body.output, input=body.input)
        db.add(route)
    db.commit()

    return {"ok": True}
