from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.source import Source, UserAccessSource
from app.schemas.mv import SourceResponse

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[SourceResponse])
def list_sources(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "admin":
        sources = db.query(Source).order_by(Source.quartz_input).all()
    else:
        allowed = db.query(UserAccessSource.source_id).filter(UserAccessSource.user_id == user.id).subquery()
        sources = db.query(Source).filter(Source.id.in_(allowed)).order_by(Source.quartz_input).all()
    return [SourceResponse(id=s.id, quartz_input=s.quartz_input, label=s.label) for s in sources]
