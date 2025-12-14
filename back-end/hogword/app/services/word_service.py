import json
import random
import os
from app.db.supabase import supabase

WORDS_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "words.json")

def load_words():
    """Lengths are cached in memory for simple random selection"""
    with open(WORDS_FILE_PATH, "r") as f:
        return json.load(f)

vocab_data = load_words()

def get_random_word(difficulty: str = "beginner"):
    """Select a random word from the specified difficulty"""
    words_list = vocab_data.get(difficulty, vocab_data["beginner"])
    return random.choice(words_list)

async def fetch_current_word(user_id: str):
    """
    Check if the user has an active word in user_state -> practice_logs
    """
    state_response = supabase.table("user_state").select("current_log_id").eq("user_id", user_id).execute()
    
    if not state_response.data or not state_response.data[0]["current_log_id"]:
        return None

    log_id = state_response.data[0]["current_log_id"]

    log_response = supabase.table("practice_logs").select("*").eq("id", log_id).execute()
    
    if log_response.data:
        log = log_response.data[0]
        return log
    
    return None

async def generate_new_word(user_id: str):
    """
    1. Mark old active word as resigned (if exists)
    2. Pick new word
    3. Create new log entry
    4. Update user_state
    """
    current_log = await fetch_current_word(user_id)
    if current_log and current_log["status"] == "active":
        supabase.table("practice_logs").update({"status": "resigned"}).eq("id", current_log["id"]).execute()

    difficulty = random.choice(["beginner", "intermediate", "advanced"])
    new_word = get_random_word(difficulty)
    new_log = {
        "user_id": user_id,
        "word": new_word,
        "difficulty": difficulty,
        "status": "active"
    }
    insert_response = supabase.table("practice_logs").insert(new_log).execute()
    new_log_id = insert_response.data[0]["id"]

    state_check = supabase.table("user_state").select("user_id").eq("user_id", user_id).execute()
    
    if state_check.data:
        supabase.table("user_state").update({"current_log_id": new_log_id}).eq("user_id", user_id).execute()
    else:
        supabase.table("user_state").insert({"user_id": user_id, "current_log_id": new_log_id}).execute()

    return {
        "word": new_word,
        "difficulty": difficulty,
        "log_id": new_log_id
    }
