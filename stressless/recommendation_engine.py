"""
recommendation_engine.py
-------------------------
Pure logic module (no Flask/DB imports) that turns a stress category +
selected interests (+ optional history) into a personalized recommendation.

Kept separate from app.py so the "brain" of StressLess is easy to read,
test and extend for the hackathon demo.

NEW RULE (priority order):
  1. User's selected activity/interest — HIGHEST PRIORITY (never overridden)
  2. Stress level — only for customizing the message, duration, difficulty
  3. Never use stress level to replace the user's selected activity
"""

import random

ACTIVITY_META = {
    "breathing":  {"emoji": "🫁", "label": "Breathing Exercise", "route": "breathing"},
    "meditation": {"emoji": "🧘", "label": "Guided Meditation",  "route": "meditation"},
    "music":      {"emoji": "🎵", "label": "Calming Sounds",     "route": "music"},
    "games":      {"emoji": "🎮", "label": "Mini Game",          "route": "games"},
    "puzzle":     {"emoji": "🧩", "label": "Puzzle Break",       "route": "puzzle"},
    "movement":   {"emoji": "🚶", "label": "Movement Break",     "route": "movement"},
    "journaling": {"emoji": "✍️", "label": "Journaling",         "route": "journal"},
    "positive":   {"emoji": "🌈", "label": "Positive Activity",  "route": "positive"},
}

# Dynamic question text per activity — shown on the recommendation screen.
DYNAMIC_QUESTIONS = {
    "games":      "Would you like to try a short calming game?",
    "music":      "Would you like to listen to some calming music?",
    "positive":   "Would you like to try a short positive activity?",
    "journaling": "Would you like to try a short journaling activity?",
    "breathing":  "Would you like to try a short breathing exercise?",
    "meditation": "Would you like to try a short meditation?",
    "movement":   "Would you like to try a short movement break?",
    "puzzle":     "Would you like to try a short puzzle?",
}

# Supportive messages per stress level.
# These acknowledge the user's stress without overriding their chosen activity.
MESSAGES = {
    "high": [
        "You've had a stressful moment.",
        "Looks like today has been a lot.",
        "Your mind sounds pretty full right now — let's help it settle a little.",
        "That's a heavy load. A few calming minutes can go a long way.",
    ],
    "moderate": [
        "Looks like you need a small reset.",
        "A short pause could help you feel steadier.",
        "Nothing major, but a quick reset never hurts.",
    ],
    "low": [
        "You're doing pretty well! Let's keep that good energy going.",
        "Nice, you're in a good spot. Let's add a little extra sparkle to your day.",
        "You're steady right now — great time for something fun.",
    ],
}


def get_recommendation(stress_category: str, interests: list[str], history: dict | None = None) -> dict:
    """
    Build a personalized recommendation.

    stress_category: 'low' | 'moderate' | 'high'
    interests: list of interest keys the user tapped, e.g. ['games', 'music']
    history: optional dict with keys like 'favorite_activity' for extra personalization

    The user's selected activity is ALWAYS respected.
    Stress level only customizes the supportive message — it NEVER replaces the activity.

    Returns a dict with:
      - message (supportive text)
      - primary (the chosen activity metadata)
      - dynamic_question (activity-specific prompt)
      - stress_level (so the frontend knows the stress context)
      - followup (optional callback to history)
    """
    stress_category = stress_category if stress_category in MESSAGES else "moderate"
    interests = interests or []

    # -------------------------------------------------------------------
    # CORE RULE: Pick from the user's selected interests ONLY.
    # If they selected multiple, randomly choose one of theirs.
    # If none provided (edge case), fall back to breathing as a safe default.
    # -------------------------------------------------------------------
    valid_interests = [i for i in interests if i in ACTIVITY_META]
    if valid_interests:
        primary_key = random.choice(valid_interests)
    else:
        primary_key = "breathing"

    # Build the supportive message — stress level shapes the tone, not the activity.
    message = random.choice(MESSAGES[stress_category])
    interest_label = ACTIVITY_META[primary_key]["label"]

    if valid_interests:
        message += f" Since you chose {interest_label.lower()}, here's a {interest_label.lower()} for you."
    else:
        message += f" Here's something to help you reset: {interest_label.lower()}."

    # Dynamic question for this specific activity.
    dynamic_question = DYNAMIC_QUESTIONS.get(
        primary_key,
        f"Would you like to try a short {interest_label.lower()}?"
    )

    # Sprinkle in a callback to history for a "learning" feel, when available.
    favorite = (history or {}).get("favorite_activity")
    followup = None
    if favorite and favorite != primary_key and favorite in ACTIVITY_META:
        followup = f"You also seemed to enjoy {ACTIVITY_META[favorite]['label'].lower()} last time — want to try that again after?"

    return {
        "message": message,
        "primary": {"key": primary_key, **ACTIVITY_META[primary_key]},
        "dynamic_question": dynamic_question,
        "stress_level": stress_category,
        "followup": followup,
        # Pairing is removed — we never force a breathing exercise alongside
        # the user's chosen activity.
        "pairing": None,
    }
