# 🌿 StressLess – Your Mood, Your Way

A wellness self-check + personalized stress-relief companion, built for a
Fitness & Wellness Hackathon.

## Stack
- **Frontend:** HTML5, CSS3, vanilla JavaScript (no frameworks/build step)
- **Backend:** Python + Flask (REST JSON API)
- **Database:** SQLite (auto-created on first run)

## Project structure
```
stressless/
├── app.py                  # Flask routes + REST API
├── database.py              # SQLite schema + connection helper
├── recommendation_engine.py # Stress-level + interest -> activity logic
├── requirements.txt
├── database/                # stressless.db is created here at runtime
├── templates/                # Jinja2 page templates
│   ├── base.html
│   ├── index.html            # Landing page
│   ├── checkin.html           # Questionnaire -> score -> interests -> recommendation
│   ├── activity.html          # Breathing / meditation / music / games / movement / positive
│   ├── journal.html
│   ├── dashboard.html
│   ├── support.html
│   └── interests.html
└── static/
    ├── css/style.css
    ├── js/
    │   ├── api.js        # shared fetch/user-id/toast helpers
    │   ├── checkin.js
    │   ├── activity.js
    │   ├── journal.js
    │   └── dashboard.js
    └── audio/README.md   # notes on adding real royalty-free audio later
```

## Running it

```bash
cd stressless
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

The database (`database/stressless.db`) is created automatically the first
time you run the app — no manual setup needed.

## How users are identified
This is an anonymous, single-device hackathon build: on first visit, the
browser generates a random UUID and stores it in `localStorage`. That id is
sent with every API call so check-ins, points, streaks and journal entries
persist across visits on the same browser — no login required.

## Main user flow
Home → Quick Check-in → Stress Score → Choose What You Feel Like Doing →
Personalized Recommendation → Interactive Activity → Re-check Stress →
Before/After Result → Points/Badge → Dashboard

## Important notes
- The stress score is explicitly labeled a **wellness self-awareness
  indicator**, never a medical diagnosis.
- If a user reports being extremely overwhelmed, the app surfaces a
  **Support** page pointing them to trusted adults / counselors /
  professionals — it never attempts to diagnose or treat anything.
- Music activity uses in-browser generated ambient sound (Web Audio API) so
  the demo works fully offline with zero licensing risk. See
  `static/audio/README.md` for how to swap in real royalty-free files later.
- Activities never promise a stress reduction — the before/after screen
  shows the change (or lack of one) honestly and supportively either way.

## REST API summary
| Method | Endpoint                 | Purpose |
|--------|---------------------------|---------|
| POST   | `/api/check-in`           | Alias of stress-score |
| POST   | `/api/stress-score`       | Submit questionnaire, get score + category |
| POST   | `/api/recommendation`     | Get a personalized activity recommendation |
| POST   | `/api/activity-complete`  | Log a completed activity, award points/badges |
| POST   | `/api/journal`            | Save a journal entry |
| GET    | `/api/journal`            | List a user's journal entries |
| GET    | `/api/history`            | Recent check-in scores (for trend charts) |
| GET    | `/api/dashboard`          | Aggregated dashboard payload |

## Possible next steps
- Add real audio files for the Music activity
- Add lightweight auth if multi-device sync is needed
- Expand the weekly trend into a full calendar/heatmap view
