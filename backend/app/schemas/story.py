from pydantic import BaseModel
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
