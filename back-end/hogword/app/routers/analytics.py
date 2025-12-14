from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.services import stats_service
from app.models.schemas import SummaryResponse

router = APIRouter(prefix="/api/summary", tags=["Analytics"])

@router.get("", response_model=SummaryResponse)
async def get_summary(user=Depends(get_current_user)):
    """
    **Get User Analytics Summary Endpoint**

    Aggregates and returns a comprehensive snapshot of the user's practice statistics for the dashboard.

    **How to use:**
    - Send a GET request to obtain the dashboard data.
    
    **Returns:**
    - **word_per_day**: List showing count of words practiced each day for the last 7 days.
    - **avg_score_today**: The average score of all completed sessions today.
    - **avg_score_all**: The user's all-time average score.
    - **score_per_day**: Average score trend over the last 7 days.
    - **avg_score_level**: Average scores broken down by difficulty level (Easy, Medium, etc.).
    - **scatter_data**: Raw data points (time vs score) suitable for plotting a scatter graph.
    - **today_skip**: Count of how many words the user skipped (resigned) today.
    """
    user_id = user.user.id
    stats = await stats_service.get_user_dashboard_stats(user_id)
    return SummaryResponse(**stats)
