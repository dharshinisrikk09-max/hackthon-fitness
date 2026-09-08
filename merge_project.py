import os
import shutil
import re

# Set up paths
root_dir = r"c:/Users/sandhiya/Desktop/dharsh"
static_dir = os.path.join(root_dir, "static")
templates_dir = os.path.join(root_dir, "templates")

# Create directories
os.makedirs(os.path.join(static_dir, "hackpro"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "stressless"), exist_ok=True)
os.makedirs(os.path.join(templates_dir, "hackpro"), exist_ok=True)
os.makedirs(os.path.join(templates_dir, "stressless"), exist_ok=True)

# 1. Move Hackpro files
if os.path.exists(os.path.join(root_dir, "hackpro", "static")):
    for item in os.listdir(os.path.join(root_dir, "hackpro", "static")):
        s = os.path.join(root_dir, "hackpro", "static", item)
        d = os.path.join(static_dir, "hackpro", item)
        if os.path.exists(d): shutil.rmtree(d) if os.path.isdir(d) else os.remove(d)
        shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)

if os.path.exists(os.path.join(root_dir, "hackpro", "templates")):
    for item in os.listdir(os.path.join(root_dir, "hackpro", "templates")):
        s = os.path.join(root_dir, "hackpro", "templates", item)
        d = os.path.join(templates_dir, "hackpro", item)
        if os.path.exists(d): shutil.rmtree(d) if os.path.isdir(d) else os.remove(d)
        shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)

# 2. Move Stressless files
if os.path.exists(os.path.join(root_dir, "stressless", "static")):
    for item in os.listdir(os.path.join(root_dir, "stressless", "static")):
        s = os.path.join(root_dir, "stressless", "static", item)
        d = os.path.join(static_dir, "stressless", item)
        if os.path.exists(d): shutil.rmtree(d) if os.path.isdir(d) else os.remove(d)
        shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)

if os.path.exists(os.path.join(root_dir, "stressless", "templates")):
    for item in os.listdir(os.path.join(root_dir, "stressless", "templates")):
        s = os.path.join(root_dir, "stressless", "templates", item)
        d = os.path.join(templates_dir, "stressless", item)
        if os.path.exists(d): shutil.rmtree(d) if os.path.isdir(d) else os.remove(d)
        shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)

# 3. Move Root HTML files to templates
for html_file in ["dashboard.html", "fitness.html", "nutrition.html", "youtube.html"]:
    s = os.path.join(root_dir, html_file)
    d = os.path.join(templates_dir, html_file)
    if os.path.exists(s):
        shutil.copy2(s, d)

# 4. Refactor hardcoded paths in Hackpro templates and code
def replace_in_file(filepath, pattern, replacement):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(pattern, replacement, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Update Hackpro static paths
for root, _, files in os.walk(os.path.join(templates_dir, "hackpro")):
    for file in files:
        if file.endswith(".html"):
            replace_in_file(os.path.join(root, file), r'/static/css/style\.css', r'/static/hackpro/css/style.css')
            replace_in_file(os.path.join(root, file), r'/static/js/main\.js', r'/static/hackpro/js/main.js')
            replace_in_file(os.path.join(root, file), r'/static/js/coach\.js', r'/static/hackpro/js/coach.js')
            replace_in_file(os.path.join(root, file), r'url_for\(\'index\'\)', r'url_for(\'hackpro.index\')')
            replace_in_file(os.path.join(root, file), r'url_for\(\'coach_page\'', r'url_for(\'hackpro.coach_page\'')

# Update Hackpro app.py to be a blueprint and fix icon paths
with open(os.path.join(root_dir, "hackpro", "app.py"), 'r', encoding='utf-8') as f:
    hackpro_code = f.read()

hackpro_code = hackpro_code.replace('app = Flask(__name__)', "from flask import Blueprint\nhackpro_bp = Blueprint('hackpro', __name__)")
hackpro_code = hackpro_code.replace('app.secret_key', '# app.secret_key')
hackpro_code = hackpro_code.replace('@app.route', '@hackpro_bp.route')
hackpro_code = hackpro_code.replace('render_template(\n        "index.html"', 'render_template(\n        "hackpro/index.html"')
hackpro_code = hackpro_code.replace('render_template(\n        "coach.html"', 'render_template(\n        "hackpro/coach.html"')
hackpro_code = hackpro_code.replace('"/static/images/', '"/static/hackpro/images/')
hackpro_code = hackpro_code.replace('url_for("index")', 'url_for("hackpro.index")')
hackpro_code = hackpro_code.replace('url_for("coach_page"', 'url_for("hackpro.coach_page"')

# Remove app.run() block from hackpro_code
hackpro_code = re.sub(r'if __name__ == "__main__":\s*app\.run\(.*?\)', '', hackpro_code, flags=re.DOTALL)

with open(os.path.join(root_dir, "hackpro_bp.py"), 'w', encoding='utf-8') as f:
    f.write(hackpro_code)

# 5. Refactor Stressless paths and app.py to be a blueprint
with open(os.path.join(root_dir, "stressless", "app.py"), 'r', encoding='utf-8') as f:
    stressless_code = f.read()

stressless_code = stressless_code.replace('app = Flask(__name__)', "from flask import Blueprint\nstressless_bp = Blueprint('stressless', __name__)")
stressless_code = stressless_code.replace('@app.route', '@stressless_bp.route')
stressless_code = re.sub(r'render_template\(([\'"])(.*?\.html)([\'"])', r'render_template(\g<1>stressless/\g<2>\g<3>', stressless_code)
stressless_code = re.sub(r'if __name__ == "__main__":\s*app\.run\(.*?\)', '', stressless_code, flags=re.DOTALL)
# It uses database.py and recommendation_engine.py, so we will need to copy those to root or adjust imports.
# Let's copy them to root for simplicity, or change imports to `from stressless.database import ...`
stressless_code = stressless_code.replace('from database import', 'from stressless.database import')
stressless_code = stressless_code.replace('from recommendation_engine import', 'from stressless.recommendation_engine import')

with open(os.path.join(root_dir, "stressless_bp.py"), 'w', encoding='utf-8') as f:
    f.write(stressless_code)

# Fix Stressless JS hardcoded audio path
act_js_path = os.path.join(static_dir, "stressless", "js", "activity.js")
replace_in_file(act_js_path, r'/static/audio/', r'/static/stressless/audio/')

# Also fix url_for('static', filename='...') in stressless templates
for root, _, files in os.walk(os.path.join(templates_dir, "stressless")):
    for file in files:
        if file.endswith(".html"):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
            # replace url_for('static', filename='css/style.css') with 'stressless/css/style.css'
            content = re.sub(r"url_for\('static',\s*filename=['\"](.*?)['\"]", r"url_for('static', filename='stressless/\g<1>'", content)
            
            # replace url_for('home') with url_for('stressless.home') etc
            for endpoint in ['home', 'checkin_page', 'journal_page', 'dashboard_page', 'support_page', 'activity_page', 'interests_page']:
                content = re.sub(r"url_for\(['\"]" + endpoint + r"['\"]", r"url_for('stressless." + endpoint + r"'", content)
                
            with open(os.path.join(root, file), 'w', encoding='utf-8') as f:
                f.write(content)

print("Refactoring complete.")
