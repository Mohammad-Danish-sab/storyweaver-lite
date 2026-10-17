from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.admin_auth import verify_admin_pin

router = APIRouter()


class AdminUnlockRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=100)


@router.post("/admin/unlock")
def unlock_admin(request: AdminUnlockRequest):
    verify_admin_pin(request.pin)
    return {"status": "unlocked"}
