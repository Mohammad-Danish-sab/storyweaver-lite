from fastapi import APIRouter, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.admin_auth import require_admin_pin
from app.core.database import get_db
from app.models.story import ReaderDeviceModel, TelemetryModel
from app.schemas.story import TelemetryLogSchema
from sqlalchemy import func

router = APIRouter()

@router.post("/telemetry")
def record_telemetry(log: TelemetryLogSchema, db: Session = Depends(get_db)):
    if log.reader_id and db.get(ReaderDeviceModel, (log.reader_id, log.library_id)) is None:
        db.add(ReaderDeviceModel(reader_id=log.reader_id, library_id=log.library_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    db_log = TelemetryModel(
        library_id=log.library_id,
        story_id=log.story_id,
        language=log.language,
        completed=log.completed,
        time_spent_seconds=log.time_spent_seconds
    )
    db.add(db_log)
    db.commit()
    return {"status": "recorded"}

@router.get("/telemetry/summary")
def get_library_summary(
    library_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_pin),
):
    total_reads = db.query(TelemetryModel).filter(
        TelemetryModel.library_id == library_id,
        TelemetryModel.completed.is_(False),
    ).count()
    completed_reads = db.query(TelemetryModel).filter(
        TelemetryModel.library_id == library_id, 
        TelemetryModel.completed == True
    ).count()
    
    top_language = db.query(
        TelemetryModel.language, func.count(TelemetryModel.language)
    ).filter(TelemetryModel.library_id == library_id).group_by(
        TelemetryModel.language
    ).order_by(func.count(TelemetryModel.language).desc()).first()

    return {
        "library_id": library_id,
        "total_sessions": total_reads,
        "unique_reader_devices": db.query(ReaderDeviceModel).filter(
            ReaderDeviceModel.library_id == library_id
        ).count(),
        "completed_stories": completed_reads,
        "completion_rate": f"{round((completed_reads / total_reads * 100), 1) if total_reads > 0 else 0}%",
        "preferred_language": top_language[0] if top_language else "kn"
    }
