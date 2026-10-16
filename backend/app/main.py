from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.stories import router as stories_router
from app.schemas.story import TelemetryLogSchema


app = FastAPI(title="StoryWeaver Lite API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep every frontend endpoint under one versioned API prefix.
app.include_router(stories_router, prefix="/api/v1", tags=["stories"])


@app.post("/api/v1/telemetry")
def log_telemetry(log: TelemetryLogSchema):
    print(
        f"[Telemetry] Library: {log.library_id} | Story: {log.story_id} "
        f"| Completed: {log.completed} | Seconds: {log.time_spent_seconds}"
    )
    return {"status": "success", "message": "Telemetry recorded successfully"}
