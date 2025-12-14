from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class AuthRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

class WordResponse(BaseModel):
    word: str
    difficulty: str
    log_id: str
    play: int

class SentenceInput(BaseModel):
    word: str
    user_sentence: str

class ValidationResult(BaseModel):
    score: float
    suggestion: Optional[str] = None
    corrected_sentence: Optional[str] = None

class ValidationResponse(ValidationResult):
    pass

class ScoreCountData(BaseModel):
    count: int
    score: float
    difficulty: str

class SummaryResponse(BaseModel):
    avg_score_today: float
    avg_score_all: float
    today_skip: int
    word_per_day: List[Any]  
    score_per_day: List[Any] 
    avg_score_level: List[Any] 
    score_count_data: List[ScoreCountData] 

class TodayLogItem(BaseModel):
    datetime: datetime
    word: str
    user_sentence: str
    score: float
    suggestion: Optional[str] = None

