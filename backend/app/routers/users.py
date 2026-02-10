from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.source import UserAccessSource
from app.models.multiviewer import UserAccessMV
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserResponse, AccessUpdate
from app.services.auth import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse)
def create_user(body: CreateUserRequest, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.login == body.login).first()
    if existing:
        raise HTTPException(status_code=409, detail="Login already exists")
    user = User(login=body.login, role=body.role, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, login=user.login, role=user.role)


@router.get("", response_model=list[UserResponse])
def list_users(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserResponse(id=u.id, login=u.login, role=u.role) for u in users]


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UpdateUserRequest, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.login is not None:
        user.login = body.login
    if body.role is not None:
        user.role = body.role
    if body.password is not None:
        user.password_hash = hash_password(body.password)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, login=user.login, role=user.role)


@router.delete("/{user_id}")
def delete_user(user_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(UserAccessSource).filter(UserAccessSource.user_id == user_id).delete()
    db.query(UserAccessMV).filter(UserAccessMV.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/{user_id}/access")
def get_access(user_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    source_ids = [r.source_id for r in db.query(UserAccessSource).filter(UserAccessSource.user_id == user_id).all()]
    mv_ids = [r.mv_id for r in db.query(UserAccessMV).filter(UserAccessMV.user_id == user_id).all()]
    return {"source_ids": source_ids, "mv_ids": mv_ids}


@router.put("/{user_id}/access")
def set_access(user_id: int, body: AccessUpdate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.source_ids is not None:
        db.query(UserAccessSource).filter(UserAccessSource.user_id == user_id).delete()
        for sid in body.source_ids:
            db.add(UserAccessSource(user_id=user_id, source_id=sid))

    if body.mv_ids is not None:
        db.query(UserAccessMV).filter(UserAccessMV.user_id == user_id).delete()
        for mid in body.mv_ids:
            db.add(UserAccessMV(user_id=user_id, mv_id=mid))

    db.commit()
    return {"ok": True}
