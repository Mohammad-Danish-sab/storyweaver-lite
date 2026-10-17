from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.story import StorySubmissionModel
from app.schemas.story import (
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
def list_submissions(status_filter: str | None = None, db: Session = Depends(get_db)):
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
):
    entry = db.get(StorySubmissionModel, submission_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Story submission not found")
    entry.status = update.status
    db.commit()
    db.refresh(entry)
    return entry
