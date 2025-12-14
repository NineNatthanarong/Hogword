from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime
from app.routers.auth import get_current_user
from app.db.supabase import supabase
from app.models.schemas import TodayLogItem

router = APIRouter(prefix="/api/today-log", tags=["Logs"])

@router.get("", response_model=List[TodayLogItem])
async def get_today_logs(user=Depends(get_current_user)):
    """
    **Get Today's Practice Logs Endpoint**

    Retrieves a historical list of all completed practice sessions for the current day.

    **How to use:**
    - Send a GET request to see what the user has achieved so far today.
    
    **Returns:**
    - A list of log objects, each containing:
        - `datetime`: Timestamp of the practice.
        - `word`: The word practiced.
        - `user_sentence`: The sentence the user wrote.
        - `score`: The validation score received.
        - `suggestion`: Feedback provided by the AI.
    """
    user_id = user.user.id
    
    # Get today's start time in UTC
    today_start = datetime.utcnow().date().isoformat()
    
    response = supabase.table("practice_logs")\
        .select("created_at, word, sentence, score, suggestion")\
        .eq("user_id", user_id)\
        .eq("status", "completed")\
        .gte("created_at", today_start)\
        .order("created_at", desc=True)\
        .execute()
        
    logs = []
    for log in response.data:
        logs.append(TodayLogItem(
            datetime=log["created_at"],
            word=log["word"],
            user_sentence=log["sentence"],
            score=log["score"],
            suggestion=log.get("suggestion")
        ))
        
    return logs
