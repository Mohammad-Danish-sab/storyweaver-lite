from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.api.v1.stories import router as stories_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.submissions import router as submissions_router
from app.core.database import Base, engine
import app.models.story  # Registers SQLAlchemy models before tables are created.


app = FastAPI(title="StoryWeaver Lite API", version="1.0")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep every frontend endpoint under one versioned API prefix.
app.include_router(stories_router, prefix="/api/v1", tags=["stories"])
app.include_router(telemetry_router, prefix="/api/v1", tags=["telemetry"])
app.include_router(submissions_router, prefix="/api/v1", tags=["submissions"])


@app.on_event("startup")
def create_database_tables():
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as error:
        # The reading catalogue is bundled in the API and must remain usable
        # when an optional telemetry database is temporarily offline.
        logger.warning("Database unavailable; continuing without telemetry and submissions: %s", error)
