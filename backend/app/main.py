from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.api.v1.stories import router as stories_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.admin import router as admin_router
from app.api.v1.translation import router as translation_router
from app.api.v1.accounts import router as accounts_router
from app.core.database import Base, engine
import app.models.story  # Registers SQLAlchemy models before tables are created.
import app.models.account  # Registers account and child-profile models before tables are created.

import os

app = FastAPI(title="StoryWeaver Lite API", version="1.0")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep every frontend endpoint under one versioned API prefix.
app.include_router(stories_router, prefix="/api/v1", tags=["stories"])
app.include_router(telemetry_router, prefix="/api/v1", tags=["telemetry"])
app.include_router(submissions_router, prefix="/api/v1", tags=["submissions"])
app.include_router(admin_router, prefix="/api/v1", tags=["admin"])
app.include_router(translation_router, prefix="/api/v1", tags=["translation"])
app.include_router(accounts_router, prefix="/api/v1", tags=["accounts"])


@app.on_event("startup")
def create_database_tables():
    try:
        Base.metadata.create_all(bind=engine)
        with engine.begin() as connection:
            child_columns = {
                column["name"]
                for column in inspect(connection).get_columns("child_profiles")
            }
            if "max_reading_level" not in child_columns:
                connection.execute(
                    text("ALTER TABLE child_profiles ADD COLUMN max_reading_level INTEGER NOT NULL DEFAULT 5")
                )
            columns = {
                column["name"]
                for column in inspect(connection).get_columns("story_submissions")
            }
            for column in ("translated_title", "translated_content"):
                if column not in columns:
                    connection.execute(
                        text(f"ALTER TABLE story_submissions ADD COLUMN {column} TEXT")
                    )
    except SQLAlchemyError as error:
        # The reading catalogue is bundled in the API and must remain usable
        # when an optional telemetry database is temporarily offline.
        logger.warning("Database unavailable; continuing without telemetry and submissions: %s", error)
