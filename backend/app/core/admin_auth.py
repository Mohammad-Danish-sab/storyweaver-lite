import hmac
import os

from fastapi import Header, HTTPException, status


def verify_admin_pin(pin: str) -> None:
    expected_pin = os.getenv("ADMIN_PIN")
    if not expected_pin:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin PIN is not configured on the server.",
        )
    if not hmac.compare_digest(pin, expected_pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin PIN.",
        )


def require_admin_pin(x_admin_pin: str | None = Header(default=None)) -> None:
    if x_admin_pin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin PIN is required.",
        )
    verify_admin_pin(x_admin_pin)
