import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException, status


load_dotenv(Path(__file__).resolve().parents[3] / ".env")

GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"


async def translate_texts(
    texts: list[str],
    source_language: str,
    target_language: str,
) -> list[str]:
    api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Cloud Translation is not configured on the server.",
        )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                GOOGLE_TRANSLATE_URL,
                headers={"X-Goog-Api-Key": api_key},
                json={
                    "q": texts,
                    "source": source_language,
                    "target": target_language,
                    "format": "text",
                },
            )
        response.raise_for_status()
        translations = response.json()["data"]["translations"]
        return [item["translatedText"] for item in translations]
    except (httpx.HTTPError, IndexError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Translation provider failed. Please try again.",
        ) from error
