from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.admin_auth import require_admin_pin
from app.core.database import get_db
from app.models.story import ContentReportModel, StorySubmissionModel
from app.schemas.story import (
    ContentReportCreate,
    ContentReportStatusUpdate,
    StorySubmissionCreate,
    StorySubmissionSchema,
    StorySubmissionStatusUpdate,
)

router = APIRouter()


@router.post("/submissions", response_model=StorySubmissionSchema, status_code=status.HTTP_201_CREATED)
def create_submission(submission: StorySubmissionCreate, db: Session = Depends(get_db)):
    entry = StorySubmissionModel(**submission.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/submissions", response_model=List[StorySubmissionSchema])
def list_submissions(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_pin),
):
    query = db.query(StorySubmissionModel)
    if status_filter:
        if status_filter not in {"pending", "published", "returned"}:
            raise HTTPException(status_code=400, detail="Invalid submission status")
        query = query.filter(StorySubmissionModel.status == status_filter)
    return query.order_by(StorySubmissionModel.created_at.desc()).all()


@router.patch("/submissions/{submission_id}", response_model=StorySubmissionSchema)
def update_submission_status(
    submission_id: int,
    update: StorySubmissionStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_pin),
):
    entry = db.get(StorySubmissionModel, submission_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Story submission not found")
    entry.status = update.status
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_content_report(report: ContentReportCreate, db: Session = Depends(get_db)):
    entry = ContentReportModel(**report.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "status": entry.status}


@router.get("/reports")
def list_content_reports(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_pin),
):
    reports = db.query(ContentReportModel).order_by(ContentReportModel.created_at.desc()).all()
    return [
        {
            "id": report.id,
            "story_id": report.story_id,
            "reason": report.reason,
            "details": report.details,
            "status": report.status,
            "created_at": report.created_at.isoformat(),
        }
        for report in reports
    ]


@router.patch("/reports/{report_id}")
def update_content_report(
    report_id: int,
    update: ContentReportStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_pin),
):
    report = db.get(ContentReportModel, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Content report not found.")
    report.status = update.status
    db.commit()
    return {"id": report.id, "status": report.status}
