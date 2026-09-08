import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, session

from flask import Blueprint
hackpro_bp = Blueprint('hackpro', __name__)
# app.secret_key = os.environ.get("SECRET_KEY", "fitpro_neon_secret_key_2026")

# In-memory storage for global state / mock database
# Max constraints per user
MAX_CONSULTATIONS = 3
MAX_DISCONTINUATIONS = 2

# 10 Gym Experts Dataset
TRAINERS = [
    {
        "id": 1,
        "name": "Jeff Cavaliere",
        "experience": "20+ Years",
        "specialized_field": "Sports Physical Therapy & Strength",
        "major_achievements": "Former Head PT for NY Mets; Created the global Athlean-X program.",
        "client_feedback": "Highly praised for science-backed, injury-free gym progressions.",
        "icon": "/static/hackpro/images/trainer_1.svg",
        "tag": "PT & Strength",
        "phone": "+1 (555) 019-4821",
        "rating": 4.9,
        "active_clients": 1420
    },
    {
        "id": 2,
        "name": "Tracy Anderson",
        "experience": "20+ Years",
        "specialized_field": "Muscle Targeting & Dance Cardio",
        "major_achievements": "Created the Tracy Anderson Method; trained Jennifer Lopez.",
        "client_feedback": "Her method “covers targeted muscle training, high reps, and Pilates-inspired workouts” making her a favorite in Hollywood.",
        "icon": "/static/hackpro/images/trainer_2.svg",
        "tag": "Target Cardio",
        "phone": "+1 (555) 024-8832",
        "rating": 4.8,
        "active_clients": 980
    },
    {
        "id": 3,
        "name": "Yasmin Karachiwala",
        "experience": "26 Years",
        "specialized_field": "Pilates & Core Conditioning",
        "major_achievements": "First BASI Pilates instructor in India; trained stars like Deepika Padukone.",
        "client_feedback": "Celebrated for her “expertise in Pilates” and making multi-disciplinary gym workouts universally accessible.",
        "icon": "/static/hackpro/images/trainer_3.svg",
        "tag": "Core Pilates",
        "phone": "+91 (555) 039-1120",
        "rating": 4.95,
        "active_clients": 1150
    },
    {
        "id": 4,
        "name": "Gunnar Peterson",
        "experience": "25+ Years",
        "specialized_field": "Functional Training & Athletic Pro Conditioning",
        "major_achievements": "Strength Director for LA Lakers; trained Mike Tyson and Khloe Kardashian.",
        "client_feedback": "Widely revered for high-intensity, personalized athletic programming.",
        "icon": "/static/hackpro/images/trainer_4.svg",
        "tag": "Athletic Pro",
        "phone": "+1 (555) 041-9921",
        "rating": 4.9,
        "active_clients": 1310
    },
    {
        "id": 5,
        "name": "Nick Mitchell",
        "experience": "20+ Years",
        "specialized_field": "Hypertrophy & Body Transformation",
        "major_achievements": "Founder of Ultimate Performance (UP Fitness) global gym empire.",
        "client_feedback": "Elite reputation for delivering extreme, data-driven body results.",
        "icon": "/static/hackpro/images/trainer_5.svg",
        "tag": "Hypertrophy",
        "phone": "+44 (555) 058-7744",
        "rating": 4.92,
        "active_clients": 1640
    },
    {
        "id": 6,
        "name": "Jeanette Jenkins",
        "experience": "30+ Years",
        "specialized_field": "Cross-Training & Mindfulness",
        "major_achievements": "Created The Hollywood Trainer; trained Pink and Serena Williams.",
        "client_feedback": "Renowned for making gym training “effective, accessible, and inspiring for everyone” with positive energy.",
        "icon": "/static/hackpro/images/trainer_6.svg",
        "tag": "Cross-Training",
        "phone": "+1 (555) 067-3312",
        "rating": 4.88,
        "active_clients": 1220
    },
    {
        "id": 7,
        "name": "Kayla Itsines",
        "experience": "15 Years",
        "specialized_field": "Plyometric HIIT for Women",
        "major_achievements": "Co-founder of Sweat App; created Bikini Body Guides (BBG).",
        "client_feedback": "Appreciated for building an empowering, massive global community.",
        "icon": "/static/hackpro/images/trainer_7.svg",
        "tag": "Plyo HIIT",
        "phone": "+61 (555) 072-8841",
        "rating": 4.91,
        "active_clients": 2100
    },
    {
        "id": 8,
        "name": "Tony Horton",
        "experience": "30+ Years",
        "specialized_field": "Power Gym Training & Calisthenics",
        "major_achievements": "Creator of the world-famous P90X home gym fitness system.",
        "client_feedback": "Acclaimed as a “master fitness trainer, speaker, motivator,” and excellent lifestyle coach.",
        "icon": "/static/hackpro/images/trainer_8.svg",
        "tag": "Power P90X",
        "phone": "+1 (555) 083-4419",
        "rating": 4.96,
        "active_clients": 2400
    },
    {
        "id": 9,
        "name": "Nick Tumminello",
        "experience": "20+ Years",
        "specialized_field": "Functional Strength Mastery",
        "major_achievements": "Known as the \"Trainer of Trainers\"; published author for NSCA.",
        "client_feedback": "Respected for dismantling fitness myths with science-backed form.",
        "icon": "/static/hackpro/images/trainer_9.svg",
        "tag": "Functional",
        "phone": "+1 (555) 091-6623",
        "rating": 4.89,
        "active_clients": 950
    },
    {
        "id": 10,
        "name": "Alexia Clark",
        "experience": "10+ Years",
        "specialized_field": "Functional Fitness & Nutrition",
        "major_achievements": "Created the QUEENTEAM global workout ecosystem.",
        "client_feedback": "Lauded for providing “comprehensive nutrition support and direct accountability” with fresh daily routines.",
        "icon": "/static/hackpro/images/trainer_10.svg",
        "tag": "Fit & Nutrition",
        "phone": "+1 (555) 102-7711",
        "rating": 4.94,
        "active_clients": 1780
    }
]

# Initial verified reviews per trainer
TRAINER_REVIEWS = {
    1: [
        {"author": "Marcus V.", "rating": 5, "comment": "Jeff's biomechanics breakdown completely resolved my rotator cuff pain while deadlifting heavy.", "date": "2 days ago"},
        {"author": "Sarah K.", "rating": 5, "comment": "Science-backed science! Best strength progressions without joint pain.", "date": "1 week ago"}
    ],
    2: [
        {"author": "Jessica M.", "rating": 5, "comment": "The muscle targeting method toned muscles I didn't know existed. Incredible workout!", "date": "3 days ago"},
        {"author": "Chloe B.", "rating": 4, "comment": "High reps burn like crazy, but the posture results speak for themselves.", "date": "2 weeks ago"}
    ],
    3: [
        {"author": "Pooja R.", "rating": 5, "comment": "Yasmin's core cues are top tier. Feels like a 1-on-1 studio session every time.", "date": "Yesterday"},
        {"author": "Rohit S.", "rating": 5, "comment": "Pilates transformed my spine mobility and core stability.", "date": "5 days ago"}
    ],
    4: [
        {"author": "Derek W.", "rating": 5, "comment": "High energy athletic conditioning. Gunnar programs like we're in the NBA finals.", "date": "3 days ago"}
    ],
    5: [
        {"author": "Viktor L.", "rating": 5, "comment": "UP Fitness standards are no joke. Dropped 8% body fat in 12 weeks with Nick.", "date": "4 days ago"}
    ],
    6: [
        {"author": "Emily T.", "rating": 5, "comment": "Jeanette's energy is infectious! Cross-training keeps workouts fresh and motivating.", "date": "6 days ago"}
    ],
    7: [
        {"author": "Sophia G.", "rating": 5, "comment": "BBG workouts are intense, fast, and empowering. Love the community!", "date": "2 days ago"}
    ],
    8: [
        {"author": "Brian C.", "rating": 5, "comment": "Tony Horton's motivation is legendary. P90X mindset changes your whole life.", "date": "1 week ago"}
    ],
    9: [
        {"author": "David P.", "rating": 5, "comment": "No fluff, pure exercise science. Fixed my squat form in one session.", "date": "3 days ago"}
    ],
    10: [
        {"author": "Elena N.", "rating": 5, "comment": "Daily workout variety and direct nutrition accountability is second to none.", "date": "Yesterday"}
    ]
}

def get_trainer_by_id(trainer_id):
    for t in TRAINERS:
        if t["id"] == trainer_id:
            return t
    return None

def init_user_session():
    if "consultation_count" not in session:
        session["consultation_count"] = 0
    if "discontinue_count" not in session:
        session["discontinue_count"] = 0
    if "confirmed_trainer_id" not in session:
        session["confirmed_trainer_id"] = None
    if "consultation_history" not in session:
        session["consultation_history"] = []

# --- HTML Page Routes ---

@hackpro_bp.route("/")
def index():
    init_user_session()
    confirmed_trainer = None
    if session.get("confirmed_trainer_id"):
        confirmed_trainer = get_trainer_by_id(session["confirmed_trainer_id"])
    
    return render_template(
        "hackpro/index.html",
        trainers=TRAINERS,
        confirmed_trainer=confirmed_trainer,
        consultation_count=session.get("consultation_count", 0),
        max_consultations=MAX_CONSULTATIONS,
        consultations_remaining=max(0, MAX_CONSULTATIONS - session.get("consultation_count", 0)),
        discontinue_count=session.get("discontinue_count", 0),
        max_discontinuations=MAX_DISCONTINUATIONS,
        discontinues_remaining=max(0, MAX_DISCONTINUATIONS - session.get("discontinue_count", 0))
    )

@hackpro_bp.route("/coach/<int:trainer_id>")
def coach_page(trainer_id):
    init_user_session()
    trainer = get_trainer_by_id(trainer_id)
    if not trainer:
        return redirect(url_for("hackpro.index"))
    
    # Check if this trainer is confirmed or user confirms here
    is_confirmed = (session.get("confirmed_trainer_id") == trainer_id)
    reviews = TRAINER_REVIEWS.get(trainer_id, [])
    
    return render_template(
        "hackpro/coach.html",
        trainer=trainer,
        is_confirmed=is_confirmed,
        reviews=reviews,
        discontinue_count=session.get("discontinue_count", 0),
        max_discontinuations=MAX_DISCONTINUATIONS,
        discontinues_remaining=max(0, MAX_DISCONTINUATIONS - session.get("discontinue_count", 0)),
        consultation_count=session.get("consultation_count", 0),
        max_consultations=MAX_CONSULTATIONS
    )

# --- REST API Endpoints ---

@hackpro_bp.route("/api/trainers", methods=["GET"])
def api_get_trainers():
    return jsonify({"trainers": TRAINERS})

@hackpro_bp.route("/api/trainers/<int:trainer_id>", methods=["GET"])
def api_get_trainer(trainer_id):
    trainer = get_trainer_by_id(trainer_id)
    if not trainer:
        return jsonify({"error": "Trainer not found"}), 404
    reviews = TRAINER_REVIEWS.get(trainer_id, [])
    return jsonify({"trainer": trainer, "reviews": reviews})

@hackpro_bp.route("/api/session", methods=["GET"])
def api_get_session():
    init_user_session()
    return jsonify({
        "consultation_count": session.get("consultation_count", 0),
        "max_consultations": MAX_CONSULTATIONS,
        "consultations_remaining": max(0, MAX_CONSULTATIONS - session.get("consultation_count", 0)),
        "discontinue_count": session.get("discontinue_count", 0),
        "max_discontinuations": MAX_DISCONTINUATIONS,
        "discontinues_remaining": max(0, MAX_DISCONTINUATIONS - session.get("discontinue_count", 0)),
        "confirmed_trainer_id": session.get("confirmed_trainer_id"),
        "consultation_history": session.get("consultation_history", [])
    })

@hackpro_bp.route("/api/consult", methods=["POST"])
def api_consult():
    init_user_session()
    data = request.get_json() or {}
    trainer_id = data.get("trainer_id")
    trainer = get_trainer_by_id(trainer_id)
    
    if not trainer:
        return jsonify({"success": False, "message": "Invalid trainer selected."}), 400

    # Strict constraint check: Max 3 consultations total
    if session["consultation_count"] >= MAX_CONSULTATIONS:
        return jsonify({
            "success": False,
            "limit_exceeded": True,
            "remembrance": f"⚠️ Consultation Limit Exceeded! You have already utilized all {MAX_CONSULTATIONS} complimentary consultations. Please confirm a primary personal trainer to continue your journey.",
            "consultation_count": session["consultation_count"],
            "consultations_remaining": 0
        }), 400

    # Increment consultation
    session["consultation_count"] += 1
    session["consultation_history"].append({
        "trainer_id": trainer_id,
        "trainer_name": trainer["name"],
        "timestamp": "Just now"
    })
    session.modified = True

    remaining = MAX_CONSULTATIONS - session["consultation_count"]
    return jsonify({
        "success": True,
        "message": f"Consultation with {trainer['name']} booked successfully!",
        "trainer": trainer,
        "consultation_count": session["consultation_count"],
        "consultations_remaining": remaining,
        "remembrance": f"Consultation confirmed! You have {remaining} consultation(s) remaining out of {MAX_CONSULTATIONS}." if remaining > 0 else f"Notice: You have now reached the maximum limit of {MAX_CONSULTATIONS} consultations."
    })

@hackpro_bp.route("/api/confirm", methods=["POST"])
def api_confirm():
    init_user_session()
    data = request.get_json() or {}
    trainer_id = data.get("trainer_id")
    trainer = get_trainer_by_id(trainer_id)

    if not trainer:
        return jsonify({"success": False, "message": "Invalid trainer selected."}), 400

    # Set confirmed trainer
    session["confirmed_trainer_id"] = trainer_id
    session.modified = True

    return jsonify({
        "success": True,
        "message": f"Congratulations! {trainer['name']} is now your confirmed Personal Tutor.",
        "redirect_url": url_for("hackpro.coach_page", trainer_id=trainer_id),
        "confirmed_trainer_id": trainer_id
    })

@hackpro_bp.route("/api/discontinue", methods=["POST"])
def api_discontinue():
    init_user_session()
    data = request.get_json() or {}
    trainer_id = data.get("trainer_id")
    
    # Constraint check: Maximum 2 discontinuations total
    if session["discontinue_count"] >= MAX_DISCONTINUATIONS:
        return jsonify({
            "success": False,
            "limit_exceeded": True,
            "remembrance": f"⛔ Discontinuation Limit Exceeded! You have already discontinued {MAX_DISCONTINUATIONS} times. In accordance with policy, further discontinuations are locked. Please continue with your current trainer or contact support.",
            "discontinue_count": session["discontinue_count"],
            "discontinues_remaining": 0
        }), 400

    # Execute discontinuation
    session["discontinue_count"] += 1
    session["confirmed_trainer_id"] = None
    session.modified = True

    remaining = MAX_DISCONTINUATIONS - session["discontinue_count"]
    return jsonify({
        "success": True,
        "message": "You have successfully discontinued your training journey with your personal tutor.",
        "discontinue_count": session["discontinue_count"],
        "discontinues_remaining": remaining,
        "redirect_url": url_for("hackpro.index"),
        "remembrance": f"Discontinued successfully. You have {remaining} discontinuation change(s) remaining out of {MAX_DISCONTINUATIONS}." if remaining > 0 else f"Alert: You have reached your maximum limit of {MAX_DISCONTINUATIONS} discontinuations!"
    })

@hackpro_bp.route("/api/reviews/<int:trainer_id>", methods=["POST"])
def api_add_review(trainer_id):
    trainer = get_trainer_by_id(trainer_id)
    if not trainer:
        return jsonify({"success": False, "message": "Trainer not found."}), 404

    data = request.get_json() or {}
    author = data.get("author", "Verified Athlete").strip() or "Verified Athlete"
    rating = int(data.get("rating", 5))
    comment = data.get("comment", "").strip()

    if not comment:
        return jsonify({"success": False, "message": "Review comment cannot be empty."}), 400

    new_review = {
        "author": author,
        "rating": min(5, max(1, rating)),
        "comment": comment,
        "date": "Just now"
    }

    if trainer_id not in TRAINER_REVIEWS:
        TRAINER_REVIEWS[trainer_id] = []
    TRAINER_REVIEWS[trainer_id].insert(0, new_review)

    return jsonify({
        "success": True,
        "message": "Review added successfully!",
        "review": new_review,
        "all_reviews": TRAINER_REVIEWS[trainer_id]
    })

@hackpro_bp.route("/api/reset", methods=["POST"])
def api_reset():
    session.clear()
    init_user_session()
    return jsonify({"success": True, "message": "Demo session reset successfully!"})


