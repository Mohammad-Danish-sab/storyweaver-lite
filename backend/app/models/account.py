from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String

from app.core.database import Base


class ParentAccountModel(Base):
    __tablename__ = "parent_accounts"

    id = Column(String(36), primary_key=True)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AccountSessionModel(Base):
    __tablename__ = "account_sessions"

    token_hash = Column(String(64), primary_key=True)
    account_id = Column(String(36), ForeignKey("parent_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PasswordResetModel(Base):
    __tablename__ = "password_resets"

    token_hash = Column(String(64), primary_key=True)
    account_id = Column(String(36), ForeignKey("parent_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used_at = Column(DateTime, nullable=True)


class ChildProfileModel(Base):
    __tablename__ = "child_profiles"

    id = Column(String(36), primary_key=True)
    parent_id = Column(String(36), ForeignKey("parent_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(24), nullable=False)
    age_band = Column(String(12), nullable=False)
    avatar = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChildLikedStoryModel(Base):
    __tablename__ = "child_liked_stories"

    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), primary_key=True)
    story_id = Column(String(100), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

