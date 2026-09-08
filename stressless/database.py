"""
database.py
------------
Handles all SQLite database setup and connections for StressLess.
Keeping this in its own file keeps app.py focused purely on routes/logic.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "stressless.db")


def get_db():
    """Return a new SQLite connection with row access by column name."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all tables if they do not already exist. Safe to call every startup."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cur = conn.cursor()

    # Basic user record - a lightweight anonymous profile identified by a client-generated UUID.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            display_name TEXT DEFAULT 'Friend',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Every stress check-in a user completes.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            mood INTEGER,
            sleep INTEGER,
            energy INTEGER,
            pressure INTEGER,
            concentration INTEGER,
            overwhelmed INTEGER,
            tiredness INTEGER,
            overall INTEGER,
            score INTEGER,
            category TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Log of every activity a user completes, including before/after scores.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            checkin_id INTEGER,
            activity_type TEXT,
            duration_minutes REAL,
            before_score INTEGER,
            after_score INTEGER,
            points_earned INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (checkin_id) REFERENCES checkins(id)
        )
    """)

    # Rolling preferences / gamification state - one row per user.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT PRIMARY KEY,
            favorite_activity TEXT,
            total_points INTEGER DEFAULT 0,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_active_date TEXT,
            activities_completed INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Per-activity-type counters, used to personalize future suggestions.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS activity_counts (
            user_id TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, activity_type),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Journal entries - free text tied to a reflective prompt.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            prompt TEXT,
            content TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Achievements / badges unlocked by the user.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            badge_code TEXT,
            badge_label TEXT,
            earned_at TEXT DEFAULT (datetime('now')),
            UNIQUE(user_id, badge_code),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
