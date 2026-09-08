import os
from flask import Flask, render_template

# Initialize the main app
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "super_secret_merged_key_2026")

# Import Blueprints
from hackpro_bp import hackpro_bp
from stressless_bp import stressless_bp

# Register Blueprints
app.register_blueprint(hackpro_bp, url_prefix='/experts')
app.register_blueprint(stressless_bp, url_prefix='/stressless')

# Main Dashboard Routes
@app.route('/')
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/fitness')
def fitness():
    return render_template('fitness.html')

@app.route('/nutrition')
def nutrition():
    return render_template('nutrition.html')

@app.route('/youtube')
def youtube():
    return render_template('youtube.html')

# Direct Aliases for FitPro coach and api endpoints
from flask import redirect, url_for
from hackpro_bp import (
    api_get_session, api_consult, api_confirm,
    api_discontinue, api_add_review, api_reset
)

@app.route('/coach/<int:trainer_id>')
def root_coach_redirect(trainer_id):
    return redirect(url_for('hackpro.coach_page', trainer_id=trainer_id))

app.add_url_rule('/api/session', 'root_api_session', api_get_session, methods=['GET'])
app.add_url_rule('/api/consult', 'root_api_consult', api_consult, methods=['POST'])
app.add_url_rule('/api/confirm', 'root_api_confirm', api_confirm, methods=['POST'])
app.add_url_rule('/api/discontinue', 'root_api_discontinue', api_discontinue, methods=['POST'])
app.add_url_rule('/api/reviews/<int:trainer_id>', 'root_api_review', api_add_review, methods=['POST'])
app.add_url_rule('/api/reset', 'root_api_reset', api_reset, methods=['POST'])

if __name__ == '__main__':
    # Ensure database dir exists for stressless if needed
    os.makedirs(os.path.join(os.path.dirname(__file__), 'stressless', 'database'), exist_ok=True)
    app.run(debug=True, port=5000)
