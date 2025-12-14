import httpx
import os
from dotenv import load_dotenv

load_dotenv()
N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL")

async def validate_sentence(word: str, user_sentence: str):
    """
    Sends the word and sentence to n8n webhook for scoring and correction.
    """
    if not N8N_WEBHOOK_URL:
        return {
            "score": 0,
            "level": "Unknown",
            "suggestion": "N8N_WEBHOOK_URL not configured",
            "corrected_sentence": user_sentence
        }

    payload = {
        "word": word,
        "user": user_sentence
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(N8N_WEBHOOK_URL, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            # Log error and re-raise for proper error handling
            raise e
        except httpx.HTTPStatusError as e:
            # Log error and re-raise for proper error handling
            raise e
