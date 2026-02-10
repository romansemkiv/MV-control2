import secrets
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User, Session as SessionModel


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_session(db: Session, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours)
    session = SessionModel(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(session)
    db.commit()
    return token


def get_user_by_token(db: Session, token: str) -> User | None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session = db.query(SessionModel).filter(
        SessionModel.token_hash == token_hash,
        SessionModel.expires_at > datetime.now(timezone.utc),
    ).first()
    if not session:
        return None
    return db.query(User).filter(User.id == session.user_id).first()


def delete_session(db: Session, token: str) -> None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db.query(SessionModel).filter(SessionModel.token_hash == token_hash).delete()
    db.commit()


def is_first_user(db: Session) -> bool:
    return db.query(User).count() == 0
