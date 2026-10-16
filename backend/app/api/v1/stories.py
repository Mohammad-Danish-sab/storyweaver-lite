from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.schemas.story import StorySchema

router = APIRouter()

STORIES_DB: List[dict] = [
    {
        "id": "story-001",
        "title_kn": "ಚಾಣಕ್ಷ ನರಿ ಮತ್ತು ಕಾಡು",
        "title_en": "The Clever Fox & The Forest",
        "level": 1,
        "cover_image": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80",
        "category": "animals",
        "pages": [
            {
                "page_number": 1,
                "text_kn": "ಒಂದಾನೊಂದು ಕಾಲದಲ್ಲಿ, ಒಂದು ಹಸಿರು ಕಾಡಿನಲ್ಲಿ ನರಿಯೊಂದು ವಾಸಿಸುತ್ತಿತ್ತು.",
                "text_en": "Once upon a time, a fox lived in a green forest.",
                "image_url": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80",
                "audio_url_kn": "/audio/fox_p1.mp3"
            },
            {
                "page_number": 2,
                "text_kn": "ನರಿಯು ಸಿಹಿಯಾದ ಮಾವಿನ ಹಣ್ಣುಗಳನ್ನು ಹುಡುಕುತ್ತಿತ್ತು.",
                "text_en": "The fox was looking for sweet mangoes.",
                "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
                "audio_url_kn": "/audio/fox_p2.mp3"
            }
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
            {
                "page_number": 1,
                "text_kn": "ದೊಡ್ಡ ನೀಲಿ ಸರೋವರದಲ್ಲಿ ಒಂದು ಮಾಂತ್ರಿಕ ಚಿನ್ನದ ಮೀನು ವಾಸಿಸುತ್ತಿತ್ತು.",
                "text_en": "In a big blue lake lived a magical golden fish.",
                "image_url": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80",
                "audio_url_kn": "/audio/fish_p1.mp3"
            }
        ]
    }
]

@router.get("/stories", response_model=List[StorySchema])
def get_stories(category: Optional[str] = None, level: Optional[int] = None):
    results = STORIES_DB
    if category and category != "all":
        results = [s for s in results if s["category"] == category]
    if level:
        results = [s for s in results if s["level"] == level]
    return results

@router.get("/stories/{story_id}", response_model=StorySchema)
def get_story(story_id: str):
    story = next((s for s in STORIES_DB if s["id"] == story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story