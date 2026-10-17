from typing import Annotated, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.translation import translate_texts

router = APIRouter()


class TranslationRequest(BaseModel):
    texts: list[Annotated[str, Field(min_length=1, max_length=5000)]] = Field(
        min_length=1,
        max_length=2,
    )
    source_language: Literal["en", "kn"]


class TranslationResponse(BaseModel):
    target_language: Literal["en", "kn"]
    translations: list[str]


@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    target_language = "kn" if request.source_language == "en" else "en"
    translations = await translate_texts(
        request.texts,
        request.source_language,
        target_language,
    )
    return TranslationResponse(
        target_language=target_language,
        translations=translations,
    )
