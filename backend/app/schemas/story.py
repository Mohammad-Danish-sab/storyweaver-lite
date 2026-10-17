from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class PageSchema(BaseModel):
    page_number: int
    text_kn: str
    text_en: str
    image_url: str
    audio_url_kn: Optional[str] = None

class StorySchema(BaseModel):
    id: str
    title_kn: str
    title_en: str
    level: int
    cover_image: str
    category: str
    pages: List[PageSchema]
    published_at: str
    trend_score: int


class StoryCreateSchema(BaseModel):
    title_kn: str = Field(min_length=2, max_length=160)
    title_en: str = Field(min_length=2, max_length=160)
    level: int = Field(ge=1, le=5)
    cover_image: str = Field(min_length=1, max_length=2048)
    category: str = Field(min_length=2, max_length=40)
    pages: List[PageSchema] = Field(min_length=1, max_length=30)


class TelemetryLogSchema(BaseModel):
    story_id: str
    library_id: str
    language: str
    completed: bool
    time_spent_seconds: int
    reader_id: str | None = Field(default=None, min_length=16, max_length=100)


class StorySubmissionCreate(BaseModel):
    """A child-authored story.  Names are deliberately not collected."""

    title: str = Field(min_length=2, max_length=100)
    content: str = Field(min_length=20, max_length=5000)
    translated_title: str | None = Field(default=None, max_length=100)
    translated_content: str | None = Field(default=None, max_length=5000)
    language: str = Field(pattern="^(en|kn)$")
    prompt: str | None = Field(default=None, max_length=200)


class StorySubmissionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    translated_title: str | None
    translated_content: str | None
    language: str
    prompt: str | None
    status: str
    created_at: datetime


class StorySubmissionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|published|returned)$")
