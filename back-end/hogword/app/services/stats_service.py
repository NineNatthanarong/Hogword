from app.db.supabase import supabase
from datetime import datetime, timedelta
from typing import List, Dict
from collections import defaultdict


DIFFICULTY_LEVEL_MAP = {
    "beginner": "beginner",
    "advanced": "advanced",
    "intermediate": "intermediate"
}


DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"]

async def get_user_dashboard_stats(user_id: str):
    """
    Fetch raw logs and compute comprehensive statistics in Python.
    
    Returns:
    - avg_score_today: Daily average score
    - avg_score_all: Total average score (all time)
    - today_skip: Daily skip count (resigned status)
    - word_per_day: Frequent words played each day for last 7 days
    - score_per_day: Average score per day for last 7 days
    - avg_score_level: Average score per difficulty level
    - score_count_data: [count, score, difficulty] data points with attempt sequences
    """
    
    all_logs_response = supabase.table("practice_logs")\
        .select("id,created_at,word,score,difficulty,status")\
        .eq("user_id", user_id)\
        .order("created_at", desc=False)\
        .execute()
    
    all_logs = all_logs_response.data
    
    today_start = datetime.utcnow().date().isoformat()
    skipped_response = supabase.table("practice_logs")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("status", "resigned")\
        .gte("created_at", today_start)\
        .execute()
    
    today_skip = len(skipped_response.data)

    # --- Aggregation Logic ---
    
    now = datetime.utcnow()
    last_7_days_date = (now - timedelta(days=6)).date()  # 7 days inclusive
    
    # Init counters
    word_per_day_map = defaultdict(lambda: defaultdict(int))  # {date: {word: count}}
    score_per_day_map = defaultdict(list)  # {date: [scores]}
    level_scores_map = defaultdict(list)  # {difficulty: [scores]}
    score_count_data = []
    
    today_scores = []
    all_scores = []
    
    # Track word attempt sequences: {word: current_count}
    word_attempt_count = defaultdict(int)

    for log in all_logs:
        # Parse timestamp
        try:
            dt = datetime.fromisoformat(log["created_at"].replace('Z', '+00:00'))
            date_key = dt.date()
        except (ValueError, KeyError):
            continue  # Skip malformed dates

        word = log.get("word", "")
        difficulty = log.get("difficulty", "")
        status = log.get("status", "")
        
        # Only process completed logs for score-based metrics
        if status == "completed":
            try:
                score = float(log["score"])
            except (ValueError, TypeError, KeyError):
                continue  # Skip if score is invalid
            
            # Increment attempt count for this word
            word_attempt_count[word] += 1
            attempt_number = word_attempt_count[word]
            
            # All time stats
            all_scores.append(score)
            level_scores_map[difficulty].append(score)
            
            # Score/Count data point with attempt sequence
            # Map difficulty names for consistency
            display_difficulty = DIFFICULTY_LEVEL_MAP.get(difficulty, difficulty)
            
            score_count_data.append({
                "count": attempt_number,
                "score": score,
                "difficulty": display_difficulty
            })

            # Today stats
            if date_key == now.date():
                today_scores.append(score)

            # Last 7 days stats
            if date_key >= last_7_days_date:
                word_per_day_map[date_key.isoformat()][word] += 1
                score_per_day_map[date_key.isoformat()].append(score)

    # --- Format Outputs ---
    
    # Word per day (last 7 days ordered) - showing word frequencies
    word_per_day = []
    score_per_day = []
    
    # Fill in data for each of the last 7 days
    for i in range(7):
        d = (now - timedelta(days=6-i)).date().isoformat()
        
        # Word frequency for this day
        words_today = word_per_day_map.get(d, {})
        word_per_day.append({
            "date": d,
            "words": dict(words_today)  # {word: count} for each word played that day
        })
        
        # Avg score for this day
        day_scores = score_per_day_map.get(d, [])
        avg_s = sum(day_scores) / len(day_scores) if day_scores else 0
        score_per_day.append({"date": d, "score": round(avg_s, 2)})

    # Averages
    avg_score_today = sum(today_scores) / len(today_scores) if today_scores else 0
    avg_score_all = sum(all_scores) / len(all_scores) if all_scores else 0
    
    # Avg score by level with label mapping and ordering
    avg_score_level = []
    for lvl, scores in level_scores_map.items():
        avg = sum(scores) / len(scores)
        # Map the level name
        display_name = DIFFICULTY_LEVEL_MAP.get(lvl, lvl)
        avg_score_level.append({"level": display_name, "score": round(avg, 2)})
    
    # Sort by the defined order
    avg_score_level.sort(key=lambda x: DIFFICULTY_ORDER.index(x["level"]) if x["level"] in DIFFICULTY_ORDER else 999)

    return {
        "avg_score_today": round(avg_score_today, 2),
        "avg_score_all": round(avg_score_all, 2),
        "today_skip": today_skip,
        "word_per_day": word_per_day,
        "score_per_day": score_per_day,
        "avg_score_level": avg_score_level,
        "score_count_data": score_count_data
    }

