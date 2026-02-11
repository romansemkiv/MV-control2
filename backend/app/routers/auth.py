from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, UserResponse
from app.services.auth import (
    hash_password,
    verify_password,
    create_session,
    delete_session,
    is_first_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    first_user = is_first_user(db)
    user = db.query(User).filter(User.login == body.login).first()

    if first_user:
        user = User(
            login=body.login,
            role="admin",
            password_hash=hash_password(body.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_session(db, user.id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400,
        path="/",
        secure=False,  # Set to True if using HTTPS
    )
    return {"id": user.id, "login": user.login, "role": user.role}


@router.post("/logout")
def logout(response: Response, request: Request, _user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = request.cookies.get("session_token")
    if token:
        delete_session(db, token)

    # Delete cookie with same params as set_cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        httponly=True,
        samesite="lax"
    )
    return {"status": "logged out"}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse(id=user.id, login=user.login, role=user.role)
