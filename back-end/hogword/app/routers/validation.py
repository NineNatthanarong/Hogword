from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.models.schemas import SentenceInput, ValidationResponse
from app.services import word_service, n8n_service
from app.db.supabase import supabase

router = APIRouter(prefix="/api/validate-sentence", tags=["Validation"])

@router.post("", response_model=ValidationResponse)
async def validate_sentence_endpoint(input_data: SentenceInput, user=Depends(get_current_user)):
    """
    **Validate Sentence Endpoint**

    Evaluates the grammatical correctness and relevance of a user's sentence containing a specific practice word.

    **How to use:**
    - Send a POST request with the `word` (the specific word being practiced) and the `user_sentence` (the sentence constructed by the user).
    - **Prerequisite**: The user must have an active practice word (fetched via `/api/word?state=fetch`).
    
    **What it does:**
    1.  **Verifies Active Session**: Checks if the submitted word matches the user's currently active practice word.
    2.  **AI Analysis**: Sends the sentence to an AI service (n8n) to grade the usage of the word.
    3.  **Data Persistence**: 
        - Updates the current practice log with the score, suggestion, and corrected sentence.
        - Marks the log as "completed".
        - If the user re-tries (submits again for the same word), it creates a new log entry to track history.

    **Returns:**
    - `score`: A numerical score (0-10 or similar scale) assessing the sentence.
    - `suggestion`: Tips or advice on how to improve the sentence.
    - `corrected_sentence`: A corrected version of the user's input if errors were found.
    """
    user_id = user.user.id
    
    active_log = await word_service.fetch_current_word(user_id)
    
    if not active_log:
        raise HTTPException(status_code=400, detail="No active word found for this user. Please fetch a word first.")
    
    if active_log["word"].lower() != input_data.word.lower():
         raise HTTPException(status_code=400, detail=f"Input word '{input_data.word}' does not match active word '{active_log['word']}'.")

    try:
        n8n_result = await n8n_service.validate_sentence(input_data.word, input_data.user_sentence)
    except Exception as e:
        raise HTTPException(status_code=502, detail="Error communicating with validation service.")
    
    update_payload = {
        "sentence": input_data.user_sentence,
        "score": n8n_result.get("score"),
        "level": n8n_result.get("level"),
        "suggestion": n8n_result.get("suggestion"),
        "corrected_sentence": n8n_result.get("corrected_sentence"),
        "status": "completed",
        "updated_at": "now()"
    }
    
    if active_log["status"] == "active":
        supabase.table("practice_logs").update(update_payload).eq("id", active_log["id"]).execute()
    else:
        new_log = {
            "user_id": user_id,
            "word": active_log["word"],
            "difficulty": active_log["difficulty"],
            **update_payload
        }
        res = supabase.table("practice_logs").insert(new_log).execute()
        
        if res.data:
             new_id = res.data[0]["id"]
             supabase.table("user_state").update({"current_log_id": new_id}).eq("user_id", user_id).execute()
    
    return ValidationResponse(
        score=n8n_result.get("score", 0),
        suggestion=n8n_result.get("suggestion"),
        corrected_sentence=n8n_result.get("corrected_sentence")
    )
