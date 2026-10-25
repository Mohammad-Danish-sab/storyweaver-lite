import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.account import AccountSessionModel, ParentAccountModel

SESSION_COOKIE = "storyweaver_session"
SESSION_TTL = timedelta(days=30)
PASSWORD_ITERATIONS = 600_000
DUMMY_PASSWORD_HASH = (
    "pbkdf2_sha256$600000$"
    "715820882c723f44fe6fd2eb5bc61e31$"
    "7aee2f34a6072b1368cc19a84605b29b33ff5fb94860a9ba2a417658d84f6f24"
)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        iterations = int(iterations)
        if algorithm != "pbkdf2_sha256" or not 1 <= iterations <= 1_000_000:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            bytes.fromhex(salt_hex),
            iterations,
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(account: ParentAccountModel, db: Session, response: Response) -> None:
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + SESSION_TTL
    db.add(AccountSessionModel(
        token_hash=_token_hash(raw_token),
        account_id=account.id,
        expires_at=expires_at,
    ))
    db.commit()
    response.set_cookie(
        key=SESSION_COOKIE,
        value=raw_token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        max_age=int(SESSION_TTL.total_seconds()),
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


def get_current_account(
    request: Request,
    db: Session = Depends(get_db),
) -> ParentAccountModel:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    session = db.get(AccountSessionModel, _token_hash(raw_token))
    if not session or session.expires_at <= datetime.utcnow():
        if session:
            db.delete(session)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in.")
    account = db.get(ParentAccountModel, session.account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    return account


def revoke_session(request: Request, db: Session) -> None:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        return
    session = db.get(AccountSessionModel, _token_hash(raw_token))
    if session:
        db.delete(session)
        db.commit()


def password_reset_token_hash(token: str) -> str:
    return _token_hash(token)
