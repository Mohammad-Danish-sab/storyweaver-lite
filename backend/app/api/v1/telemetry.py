from fastapi import APIRouter
from app.schemas.story import TelemetryLogSchema

router = APIRouter()

@router.post("/telemetry")
def record_telemetry(log: TelemetryLogSchema):
    print(f"[RDPR Telemetry] Library: {log.library_id} | Story: {log.story_id} | Lang: {log.language} | Completed: {log.completed}")
    return {"status": "success"}