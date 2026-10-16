from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="StoryWeaver Lite API", version="1.0")

# Enable CORS so the React frontend can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class Story(BaseModel):
    id: str
    title_kn: str
    title_en: str
    level: int
    cover_image: str
    category: str
    pages: List[str]  # Image URLs or text for the story pages

class TelemetryLog(BaseModel):
    story_id: str
    library_id: str
    language: str
    completed: bool

# --- Mock Database ---
STORIES_DB = [
    {
           "id": "story-001",
           "title_kn": "ಚಾಣಕ್ಷ ನರಿ ಮತ್ತು ಕಾಡು",
           "title_en": "The Clever Fox & The Forest",
           "level": 1,
           "cover_image": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80",
           "category": "animals",
           "pages": [
            "Page 1: Once upon a time, a fox lived in a green forest...",
            "Page 2: The fox was looking for sweet mangoes...",
            "Page 3: Moral: Cleverness helps in difficult times."
        ]
    },
    {
          "id": "story-002",
           "title_kn": "ಚಿನ್ನದ ಮೀನು",
           "title_en": "The Golden Fish",
           "level": 2,
           "cover_image": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80",
           "category": "folktales",
           "pages": [
            "Page 1: In a big blue lake lived a magical golden fish...",
            "Page 2: A kind fisherman caught it and set it free..."
        ]
    }
]

@app.get("/api/stories", response_model=List[Story])
def get_stories(category: Optional[str] = None, level: Optional[int] = None):
    results = STORIES_DB
    if category:
        results = [s for s in results if s["category"] == category]
    if level:
        results = [s for s in results if s["level"] == level]
    return results

@app.get("/api/stories/{story_id}", response_model=Story)
def get_story_by_id(story_id: str):
    story = next((s for s in STORIES_DB if s["id"] == story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@app.post("/api/telemetry")
def log_telemetry(log: TelemetryLog):
    print(f"[Telemetry Log] Library: {log.library_id} | Story: {log.story_id} | Completed: {log.completed}")
    return {"status": "success", "message": "Telemetry recorded successfully"}