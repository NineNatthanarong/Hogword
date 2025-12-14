from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services import word_service
from app.models.schemas import WordResponse

router = APIRouter(prefix="/api/word", tags=["Words"])

@router.get("", response_model=WordResponse)
async def get_word(state: str = "fetch", user=Depends(get_current_user)):
    """
    **Get Practice Word Endpoint**

    Retrieves a word for the user to practice. It supports two modes of operation controlled by the `state` query parameter.

    **How to use:**
    - `GET /api/word?state=fetch` (Default):
        - **Purpose**: Continue an existing practice session or start a new one if none exists.
        - **Behavior**: Checks if the user has an incomplete ("active") word in their log. 
            - If **Yes**: Returns that active word.
            - If **No**: Automatically generates a new word and returns it.
    
    - `GET /api/word?state=gen`:
        - **Purpose**: Force start a new practice session.
        - **Behavior**: Disregards any current active word (marking it as resigned/skipped) and immediately generates and returns a new random word.

    **Returns:**
    - JSON object containing the `word`, its `difficulty`, and the unique `log_id` for this practice session.
    """
    user_id = user.user.id
    
    if state == "fetch":
        active_log = await word_service.fetch_current_word(user_id)
        if active_log:
            is_played = 1 if active_log["status"] == "completed" else 0
            return WordResponse(
                word=active_log["word"],
                difficulty=active_log["difficulty"],
                log_id=active_log["id"],
                play=is_played
            )
        else:
            new_data = await word_service.generate_new_word(user_id)
            return WordResponse(
                word=new_data["word"],
                difficulty=new_data["difficulty"],
                log_id=new_data["log_id"],
                play=0
            )

    elif state == "gen":
        new_data = await word_service.generate_new_word(user_id)
        return WordResponse(
            word=new_data["word"],
            difficulty=new_data["difficulty"],
            log_id=new_data["log_id"],
            play=0
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid state parameter. Use 'fetch' or 'gen'.")
