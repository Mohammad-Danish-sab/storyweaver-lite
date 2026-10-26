import os
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage
from uuid import uuid4
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import (
    clear_session_cookie,
    create_session,
    DUMMY_PASSWORD_HASH,
    get_current_account,
    hash_password,
    password_reset_token_hash,
    revoke_session,
    verify_password,
)
from app.core.database import get_db
from app.models.account import (
    AccountSessionModel,
    ChildLikedStoryModel,
    ChildProfileModel,
    ChildSavedStoryModel,
    ChildStoryProgressModel,
    ParentAccountModel,
    ParentSavedStoryModel,
    PasswordResetModel,
    WritingDraftModel,
)
from app.schemas.story import ChildReadingLevelUpdate, ChildStoryProgressUpdate

router = APIRouter()
logger = logging.getLogger(__name__)
VALID_AGE_BANDS = {"under-6", "6-8", "9-12"}
VALID_AVATARS = {"🦊", "🐼", "🐸", "🦋", "🐯", "🐢", "🐰", "🐳"}


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=200)
    password: str = Field(min_length=12, max_length=128)


class ChildProfileCreate(BaseModel):
    user_id: str = Field(min_length=3, max_length=20, pattern=r"^[A-Za-z0-9_-]{3,20}$")
    name: str = Field(min_length=2, max_length=24)
    age_band: str
    avatar: str


class ChildLikeRequest(BaseModel):
    story_id: str = Field(min_length=1, max_length=100)


class ChildSavedStoryRequest(BaseModel):
    story_id: str = Field(min_length=1, max_length=100)


class WritingDraftRequest(BaseModel):
    title: str = Field(default="", max_length=160)
    content: str = Field(default="", max_length=5000)
    prompt: str = Field(default="", max_length=200)


def account_response(account: ParentAccountModel) -> dict:
    return {"id": account.id, "email": account.email}


def _owned_child(child_id: str, account_id: str, db: Session) -> ChildProfileModel:
    child = db.query(ChildProfileModel).filter(
        ChildProfileModel.id == child_id,
        ChildProfileModel.parent_id == account_id,
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found.")
    return child


def child_response(child: ChildProfileModel, db: Session) -> dict:
    likes = db.query(ChildLikedStoryModel.story_id).filter(
        ChildLikedStoryModel.child_id == child.id,
    ).all()
    saved = db.query(ChildSavedStoryModel.story_id).filter(
        ChildSavedStoryModel.child_id == child.id,
    ).all()
    progress = db.query(ChildStoryProgressModel).filter(
        ChildStoryProgressModel.child_id == child.id,
    ).all()
    return {
        "id": child.id,
        "userId": child.user_id,
        "name": child.name,
        "ageBand": child.age_band,
        "avatar": child.avatar,
        "likedStoryIds": [row[0] for row in likes],
        "savedStoryIds": [row[0] for row in saved],
        "readingProgress": [
            {"storyId": row.story_id, "lastPage": row.last_page, "completed": row.completed}
            for row in progress
        ],
        "maxReadingLevel": child.max_reading_level,
        "authoredStories": [],
        "createdAt": child.created_at.isoformat(),
    }


def _send_password_reset(email: str, reset_url: str) -> None:
    host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not host or not sender:
        raise HTTPException(
            status_code=503,
            detail="Password recovery is not configured. Contact the library administrator.",
        )

    message = EmailMessage()
    message["Subject"] = "Reset your StoryWeaver password"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        "We received a request to reset your StoryWeaver password.\n\n"
        f"Use this link within 30 minutes: {reset_url}\n\n"
        "If you did not request this reset, you can ignore this email."
    )

    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError as error:
        raise HTTPException(status_code=503, detail="SMTP_PORT must be a valid port number.") from error
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=15) as server:
                if username:
                    server.login(username, password or "")
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.starttls(context=ssl.create_default_context())
                if username:
                    server.login(username, password or "")
                server.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise HTTPException(status_code=503, detail="The password reset email could not be sent. Please try again later.") from error


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(
    credentials: Credentials,
    response: Response,
    db: Session = Depends(get_db),
):
    account = ParentAccountModel(
        id=str(uuid4()),
        email=str(credentials.email).strip().lower(),
        password_hash=hash_password(credentials.password),
    )
    db.add(account)
    try:
        db.flush()
        create_session(account, db, response)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from error
    return account_response(account)


@router.post("/auth/login")
def login(
    credentials: LoginCredentials,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(credentials.email).strip().lower()
    account = db.query(ParentAccountModel).filter(ParentAccountModel.email == email).first()
    password_hash = account.password_hash if account else DUMMY_PASSWORD_HASH
    if not verify_password(credentials.password, password_hash) or not account:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    create_session(account, db, response)
    return account_response(account)


@router.get("/auth/me")
def current_account(account: ParentAccountModel = Depends(get_current_account)):
    return account_response(account)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    revoke_session(request, db)
    clear_session_cookie(response)


@router.post("/auth/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    if not os.getenv("SMTP_HOST") or not os.getenv("SMTP_FROM"):
        raise HTTPException(
            status_code=503,
            detail="Password recovery is not configured. Contact the library administrator.",
        )
    email = str(request.email).strip().lower()
    account = db.query(ParentAccountModel).filter(ParentAccountModel.email == email).first()
    if account:
        raw_token = secrets.token_urlsafe(48)
        token = PasswordResetModel(
            token_hash=password_reset_token_hash(raw_token),
            account_id=account.id,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
        db.add(token)
        db.commit()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        try:
            _send_password_reset(email, f"{frontend_url}/?reset_token={raw_token}")
        except HTTPException as error:
            db.delete(token)
            db.commit()
            logger.error("Password reset email delivery failed for account %s: %s", account.id, error.detail)
            raise
    return {"message": "If an account exists for that email, password reset instructions have been sent."}


@router.post("/auth/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    reset = db.get(PasswordResetModel, password_reset_token_hash(request.token))
    if not reset or reset.used_at or reset.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired.")

    account = db.get(ParentAccountModel, reset.account_id)
    if not account:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired.")
    account.password_hash = hash_password(request.password)
    reset.used_at = datetime.utcnow()
    db.query(AccountSessionModel).filter(AccountSessionModel.account_id == account.id).delete()
    db.commit()
    return {"message": "Your password has been updated. Please sign in."}


@router.get("/children")
def list_children(
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    children = db.query(ChildProfileModel).filter(
        ChildProfileModel.parent_id == account.id,
    ).order_by(ChildProfileModel.created_at.asc()).all()
    return [child_response(child, db) for child in children]


@router.post("/children", status_code=status.HTTP_201_CREATED)
def create_child(
    request: ChildProfileCreate,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    user_id = request.user_id.lower()
    if request.age_band not in VALID_AGE_BANDS or request.avatar not in VALID_AVATARS:
        raise HTTPException(status_code=422, detail="Choose a valid age group and avatar.")
    child = ChildProfileModel(
        id=str(uuid4()),
        parent_id=account.id,
        user_id=user_id,
        name=request.name.strip(),
        age_band=request.age_band,
        avatar=request.avatar,
        max_reading_level={"under-6": 1, "6-8": 2, "9-12": 5}[request.age_band],
    )
    db.add(child)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="That user ID is already in use. Choose another one.") from error
    db.refresh(child)
    return child_response(child, db)


@router.post("/children/{child_id}/likes")
def toggle_child_like(
    child_id: str,
    request: ChildLikeRequest,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    child = _owned_child(child_id, account.id, db)
    liked = db.get(ChildLikedStoryModel, (child.id, request.story_id))
    if liked:
        db.delete(liked)
        is_liked = False
    else:
        db.add(ChildLikedStoryModel(child_id=child.id, story_id=request.story_id))
        is_liked = True
    db.commit()
    return {"storyId": request.story_id, "liked": is_liked}


@router.put("/children/{child_id}/progress")
def update_child_progress(
    child_id: str,
    request: ChildStoryProgressUpdate,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    child = _owned_child(child_id, account.id, db)
    progress = db.get(ChildStoryProgressModel, (child.id, request.story_id))
    if progress is None:
        progress = ChildStoryProgressModel(
            child_id=child.id,
            story_id=request.story_id,
            last_page=request.last_page,
            completed=request.completed,
        )
        db.add(progress)
    else:
        progress.last_page = request.last_page
        progress.completed = progress.completed or request.completed
        progress.updated_at = datetime.utcnow()
    db.commit()
    return {
        "storyId": progress.story_id,
        "lastPage": progress.last_page,
        "completed": progress.completed,
    }


@router.post("/children/{child_id}/saved")
def toggle_child_saved_story(
    child_id: str,
    request: ChildSavedStoryRequest,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    child = _owned_child(child_id, account.id, db)
    saved = db.get(ChildSavedStoryModel, (child.id, request.story_id))
    if saved:
        db.delete(saved)
        is_saved = False
    else:
        db.add(ChildSavedStoryModel(child_id=child.id, story_id=request.story_id))
        is_saved = True
    db.commit()
    return {"storyId": request.story_id, "saved": is_saved}


@router.patch("/children/{child_id}/settings")
def update_child_settings(
    child_id: str,
    request: ChildReadingLevelUpdate,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    child = _owned_child(child_id, account.id, db)
    child.max_reading_level = request.max_reading_level
    db.commit()
    return {"childId": child.id, "maxReadingLevel": child.max_reading_level}


@router.get("/writing-draft")
def get_writing_draft(
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    draft = db.get(WritingDraftModel, account.id)
    if not draft:
        return None
    return {
        "title": draft.title,
        "content": draft.content,
        "prompt": draft.prompt,
        "updatedAt": draft.updated_at.isoformat(),
    }


@router.put("/writing-draft")
def save_writing_draft(
    request: WritingDraftRequest,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    draft = db.get(WritingDraftModel, account.id)
    if draft is None:
        draft = WritingDraftModel(account_id=account.id, **request.model_dump())
        db.add(draft)
    else:
        draft.title = request.title
        draft.content = request.content
        draft.prompt = request.prompt
        draft.updated_at = datetime.utcnow()
    db.commit()
    return {"saved": True, "updatedAt": draft.updated_at.isoformat()}


@router.get("/saved-stories")
def list_saved_stories(
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    rows = db.query(ParentSavedStoryModel.story_id).filter(
        ParentSavedStoryModel.account_id == account.id,
    ).all()
    return {"storyIds": [row[0] for row in rows]}


@router.post("/saved-stories")
def toggle_saved_story(
    request: ChildSavedStoryRequest,
    account: ParentAccountModel = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    saved = db.get(ParentSavedStoryModel, (account.id, request.story_id))
    if saved:
        db.delete(saved)
        is_saved = False
    else:
        db.add(ParentSavedStoryModel(account_id=account.id, story_id=request.story_id))
        is_saved = True
    db.commit()
    return {"storyId": request.story_id, "saved": is_saved}
