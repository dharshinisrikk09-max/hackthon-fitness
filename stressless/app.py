"""
app.py
------
StressLess - Your Mood, Your Way
Flask backend: page routes + JSON REST API.

Run with:  python app.py
Then open: http://127.0.0.1:5000
"""

import uuid
import json
from datetime import datetime, timedelta

from flask import Flask, render_template, request, jsonify

from database import init_db, get_db
from recommendation_engine import get_recommendation, ACTIVITY_META

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Badge definitions used by the gamification system.
# ---------------------------------------------------------------------------
BADGES = {
    "first_reset":      {"emoji": "🌱", "label": "First Reset",           "desc": "Completed your very first activity."},
    "breathing_begin":  {"emoji": "🫁", "label": "Breathing Beginner",    "desc": "Completed a breathing exercise."},
    "calm_listener":    {"emoji": "🎵", "label": "Calm Listener",         "desc": "Completed a music/relaxation session."},
    "relax_gamer":      {"emoji": "🎮", "label": "Relaxation Gamer",      "desc": "Completed a mini game."},
    "streak_3":         {"emoji": "🔥", "label": "3-Day Wellness Streak", "desc": "Checked in 3 days in a row."},
    "journal_starter":  {"emoji": "✍️", "label": "Journal Starter",       "desc": "Wrote your first journal entry."},
    "meditator":        {"emoji": "🧘", "label": "Mindful Moment",        "desc": "Completed a guided meditation."},
    "mover":            {"emoji": "🚶", "label": "Movement Master",       "desc": "Completed a movement break."},
}

ACTIVITY_TO_BADGE = {
    "breathing": "breathing_begin",
    "music": "calm_listener",
    "games": "relax_gamer",
    "meditation": "meditator",
    "movement": "mover",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_user(user_id):
    """Create a user + preferences row if this is the first time we see this id."""
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO users (id) VALUES (?)", (user_id,))
    conn.execute("INSERT OR IGNORE INTO preferences (user_id) VALUES (?)", (user_id,))
    conn.commit()
    conn.close()


def get_user_id_from_request():
    """User id can arrive via JSON body, query string, or header — check all three."""
    data = request.get_json(silent=True) or {}
    uid = data.get("user_id") or request.args.get("user_id") or request.headers.get("X-User-Id")
    if not uid:
        uid = str(uuid.uuid4())
    ensure_user(uid)
    return uid


def calculate_score(answers: dict) -> tuple[int, str]:
    """
    Turn the 8 questionnaire answers (each 0-10, where higher = more stress-leaning
    for negative items, and we invert the positive ones) into a single 0-100 score.

    Expected keys: mood, sleep, energy, pressure, concentration,
                   overwhelmed, tiredness, overall
    Each is a slider value 0 (great) - 10 (rough) as provided by the frontend.
    """
    keys = ["mood", "sleep", "energy", "pressure", "concentration",
            "overwhelmed", "tiredness", "overall"]
    total = 0
    for k in keys:
        val = int(answers.get(k, 5))
        val = max(0, min(10, val))
        total += val

    # total ranges 0-80 -> scale to 0-100
    score = round((total / 80) * 100)

    if score < 34:
        category = "low"
    elif score < 67:
        category = "moderate"
    else:
        category = "high"

    return score, category


def award_points_and_streak(user_id, points):
    """Update total points, activity count, and daily streak for a user."""
    conn = get_db()
    prefs = conn.execute("SELECT * FROM preferences WHERE user_id = ?", (user_id,)).fetchone()

    today = datetime.now().date()
    last_active = prefs["last_active_date"]
    new_streak = prefs["current_streak"] or 0

    if last_active:
        last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
        if last_date == today:
            pass  # already active today, streak unchanged
        elif last_date == today - timedelta(days=1):
            new_streak += 1
        else:
            new_streak = 1
    else:
        new_streak = 1

    longest = max(prefs["longest_streak"] or 0, new_streak)

    conn.execute("""
        UPDATE preferences
        SET total_points = total_points + ?,
            activities_completed = activities_completed + 1,
            current_streak = ?,
            longest_streak = ?,
            last_active_date = ?
        WHERE user_id = ?
    """, (points, new_streak, longest, today.isoformat(), user_id))
    conn.commit()
    conn.close()
    return new_streak


def unlock_badge(user_id, badge_code):
    """Insert a badge if the user doesn't already have it. Returns True if newly earned."""
    if badge_code not in BADGES:
        return False
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO achievements (user_id, badge_code, badge_label) VALUES (?, ?, ?)",
            (user_id, badge_code, BADGES[badge_code]["label"]),
        )
        conn.commit()
        newly_earned = conn.total_changes > 0
    except Exception:
        newly_earned = False
    conn.close()
    return newly_earned


def update_favorite_activity(user_id, activity_type):
    """Bump the per-activity counter and recompute the user's favorite activity type."""
    conn = get_db()
    conn.execute("""
        INSERT INTO activity_counts (user_id, activity_type, count)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, activity_type) DO UPDATE SET count = count + 1
    """, (user_id, activity_type))

    top = conn.execute("""
        SELECT activity_type FROM activity_counts
        WHERE user_id = ? ORDER BY count DESC LIMIT 1
    """, (user_id,)).fetchone()

    if top:
        conn.execute("UPDATE preferences SET favorite_activity = ? WHERE user_id = ?",
                     (top["activity_type"], user_id))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Page routes (server-rendered templates; JS handles the interactivity)
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/checkin")
def checkin_page():
    return render_template("checkin.html")


@app.route("/interests")
def interests_page():
    return render_template("interests.html")


@app.route("/activity/<activity_type>")
def activity_page(activity_type):
    if activity_type not in ACTIVITY_META and activity_type not in ("positive",):
        activity_type = "breathing"
    return render_template("activity.html", activity_type=activity_type,
                            meta=ACTIVITY_META.get(activity_type, {"emoji": "🌈", "label": "Positive Activity"}))


@app.route("/journal")
def journal_page():
    return render_template("journal.html")


@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/support")
def support_page():
    return render_template("support.html")


# ---------------------------------------------------------------------------
# REST API
# ---------------------------------------------------------------------------

@app.route("/api/check-in", methods=["POST"])
def api_checkin():
    """Alias / simple entry point some flows may use before the full stress-score call."""
    return api_stress_score()


@app.route("/api/stress-score", methods=["POST"])
def api_stress_score():
    """
    Accepts questionnaire answers, stores a check-in row, returns the score + category.

    Body: { user_id, mood, sleep, energy, pressure, concentration,
            overwhelmed, tiredness, overall }
    """
    try:
        data = request.get_json(force=True) or {}
        user_id = get_user_id_from_request()
        score, category = calculate_score(data)

        conn = get_db()
        cur = conn.execute("""
            INSERT INTO checkins (user_id, mood, sleep, energy, pressure, concentration,
                                   overwhelmed, tiredness, overall, score, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get("mood", 5), data.get("sleep", 5), data.get("energy", 5),
            data.get("pressure", 5), data.get("concentration", 5),
            data.get("overwhelmed", 5), data.get("tiredness", 5),
            data.get("overall", 5), score, category,
        ))
        checkin_id = cur.lastrowid
        conn.commit()
        conn.close()

        # Flag extreme overwhelm so the frontend can gently surface the support section.
        show_support = int(data.get("overwhelmed", 0)) >= 9 or score >= 90

        return jsonify({
            "ok": True,
            "user_id": user_id,
            "checkin_id": checkin_id,
            "score": score,
            "category": category,
            "show_support": show_support,
            "disclaimer": "This score is a self-awareness indicator only, not a medical diagnosis."
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/recommendation", methods=["POST"])
def api_recommendation():
    """
    Body: { user_id, category, interests: [...] }
    Returns a personalized recommendation combining stress level + interests + history.
    """
    try:
        data = request.get_json(force=True) or {}
        user_id = get_user_id_from_request()
        category = data.get("category", "moderate")
        interests = data.get("interests", [])

        conn = get_db()
        prefs = conn.execute("SELECT * FROM preferences WHERE user_id = ?", (user_id,)).fetchone()
        conn.close()

        history = {"favorite_activity": prefs["favorite_activity"]} if prefs else {}
        rec = get_recommendation(category, interests, history)

        return jsonify({"ok": True, "recommendation": rec, "stress_level": category})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/activity-complete", methods=["POST"])
def api_activity_complete():
    """
    Body: { user_id, checkin_id, activity_type, duration_minutes, before_score, after_score }
    Logs completion, awards points, updates streak/favorite, unlocks badges.
    """
    try:
        data = request.get_json(force=True) or {}
        user_id = get_user_id_from_request()
        activity_type = data.get("activity_type", "breathing")
        duration = float(data.get("duration_minutes", 1))
        before_score = data.get("before_score")
        after_score = data.get("after_score")
        checkin_id = data.get("checkin_id")

        points = 10 + round(duration)  # simple points formula, fun not precise

        conn = get_db()
        conn.execute("""
            INSERT INTO activity_log (user_id, checkin_id, activity_type, duration_minutes,
                                       before_score, after_score, points_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, checkin_id, activity_type, duration, before_score, after_score, points))
        conn.commit()
        conn.close()

        streak = award_points_and_streak(user_id, points)
        update_favorite_activity(user_id, activity_type)

        # Badge logic
        new_badges = []
        conn = get_db()
        total_done = conn.execute(
            "SELECT activities_completed FROM preferences WHERE user_id = ?", (user_id,)
        ).fetchone()["activities_completed"]
        conn.close()

        if total_done == 1 and unlock_badge(user_id, "first_reset"):
            new_badges.append(BADGES["first_reset"])
        badge_code = ACTIVITY_TO_BADGE.get(activity_type)
        if badge_code and unlock_badge(user_id, badge_code):
            new_badges.append(BADGES[badge_code])
        if streak >= 3 and unlock_badge(user_id, "streak_3"):
            new_badges.append(BADGES["streak_3"])

        diff = None
        if before_score is not None and after_score is not None:
            diff = int(before_score) - int(after_score)

        return jsonify({
            "ok": True,
            "points_earned": points,
            "streak": streak,
            "before_score": before_score,
            "after_score": after_score,
            "difference": diff,
            "new_badges": new_badges,
            "disclaimer": "Activities aren't guaranteed to lower stress every time — be kind to yourself either way."
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/journal", methods=["POST"])
def api_journal():
    """Body: { user_id, prompt, content } -> saves a journal entry."""
    try:
        data = request.get_json(force=True) or {}
        user_id = get_user_id_from_request()
        prompt = data.get("prompt", "")
        content = data.get("content", "").strip()

        if not content:
            return jsonify({"ok": False, "error": "Journal entry can't be empty."}), 400

        conn = get_db()
        conn.execute("INSERT INTO journal_entries (user_id, prompt, content) VALUES (?, ?, ?)",
                     (user_id, prompt, content))
        conn.commit()
        conn.close()

        first_entry = unlock_badge(user_id, "journal_starter")

        return jsonify({"ok": True, "saved": True,
                         "new_badge": BADGES["journal_starter"] if first_entry else None})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/journal", methods=["GET"])
def api_journal_history():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"ok": True, "entries": []})
    conn = get_db()
    rows = conn.execute(
        "SELECT prompt, content, created_at FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({"ok": True, "entries": [dict(r) for r in rows]})


@app.route("/api/history", methods=["GET"])
def api_history():
    """Returns recent check-in scores for trend charting."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"ok": True, "checkins": []})

    conn = get_db()
    rows = conn.execute("""
        SELECT score, category, created_at FROM checkins
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 14
    """, (user_id,)).fetchall()
    conn.close()

    checkins = [dict(r) for r in rows][::-1]  # chronological order for charts
    return jsonify({"ok": True, "checkins": checkins})


@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    """Aggregates everything the dashboard page needs into one payload."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"ok": False, "error": "user_id required"}), 400

    ensure_user(user_id)
    conn = get_db()

    prefs = conn.execute("SELECT * FROM preferences WHERE user_id = ?", (user_id,)).fetchone()
    last_checkin = conn.execute(
        "SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,)
    ).fetchone()
    trend_rows = conn.execute(
        "SELECT score, created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 7",
        (user_id,)
    ).fetchall()
    recent_activities = conn.execute(
        "SELECT activity_type, before_score, after_score, created_at FROM activity_log "
        "WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", (user_id,)
    ).fetchall()
    badges = conn.execute(
        "SELECT badge_code, badge_label, earned_at FROM achievements WHERE user_id = ? ORDER BY earned_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()

    recommendation = None
    if last_checkin:
        favorite = prefs["favorite_activity"] if prefs else None
        recommendation = get_recommendation(
            last_checkin["category"], [favorite] if favorite else [], {"favorite_activity": favorite}
        )

    return jsonify({
        "ok": True,
        "current_score": last_checkin["score"] if last_checkin else None,
        "current_category": last_checkin["category"] if last_checkin else None,
        "today_mood": last_checkin["mood"] if last_checkin else None,
        "recommendation": recommendation,
        "activities_completed": prefs["activities_completed"] if prefs else 0,
        "total_points": prefs["total_points"] if prefs else 0,
        "current_streak": prefs["current_streak"] if prefs else 0,
        "longest_streak": prefs["longest_streak"] if prefs else 0,
        "favorite_activity": prefs["favorite_activity"] if prefs else None,
        "trend": [dict(r) for r in trend_rows][::-1],
        "recent_activities": [dict(r) for r in recent_activities],
        "badges": [dict(r) for r in badges],
        "all_badges": BADGES,
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
