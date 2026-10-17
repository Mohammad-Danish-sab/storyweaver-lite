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

class TelemetryLogSchema(BaseModel):
    story_id: str
    library_id: str
    language: str
    completed: bool
    time_spent_seconds: int


class StorySubmissionCreate(BaseModel):
    """A child-authored story.  Names are deliberately not collected."""

    title: str = Field(min_length=2, max_length=100)
    content: str = Field(min_length=20, max_length=5000)
    language: str = Field(pattern="^(en|kn)$")
    prompt: str | None = Field(default=None, max_length=200)


class StorySubmissionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    language: str
    prompt: str | None
    status: str
    created_at: datetime


class StorySubmissionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|published|returned)$")
