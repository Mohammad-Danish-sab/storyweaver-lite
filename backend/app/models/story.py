from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class StoryModel(Base):
    __tablename__ = "stories"

    id = Column(String, primary_key=True, index=True)
    title_kn = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    level = Column(Integer, default=1)
    category = Column(String, index=True)
    cover_image = Column(String, nullable=False)
    is_featured = Column(Boolean, default=False)
    
    pages = relationship("PageModel", back_populates="story", cascade="all, delete-orphan")

class PageModel(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(String, ForeignKey("stories.id"))
    page_number = Column(Integer, nullable=False)
    text_kn = Column(Text, nullable=False)
    text_en = Column(Text, nullable=False)
    image_url = Column(String, nullable=False)
    audio_url_kn = Column(String, nullable=True)

    story = relationship("StoryModel", back_populates="pages")

class TelemetryModel(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    library_id = Column(String, index=True)
    story_id = Column(String, nullable=False)
    language = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReaderDeviceModel(Base):
    __tablename__ = "reader_devices"

    reader_id = Column(String, primary_key=True)
    library_id = Column(String, primary_key=True, index=True)
    first_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class StoryDeletionModel(Base):
    __tablename__ = "story_deletions"

    story_id = Column(String, primary_key=True)
    deleted_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class StoryMetadataModel(Base):
    __tablename__ = "story_metadata"

    story_id = Column(String, primary_key=True)
    published_at = Column(String, nullable=False)
    trend_score = Column(Integer, default=0, nullable=False)


class StorySubmissionModel(Base):
    __tablename__ = "story_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    translated_title = Column(String(100), nullable=True)
    translated_content = Column(Text, nullable=True)
    language = Column(String(2), nullable=False)
    prompt = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
