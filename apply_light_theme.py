import os
import re

light_theme_root = """    :root {
      /* App Backgrounds (Secondary) */
      --bg-outside: #e7e7e7;
      --app-bg: #e7e7e7;
      --sidebar-bg: #e7e7e7;
      --bg-primary: #e7e7e7;
      
      /* Surfaces / Cards */
      --card-bg: #ffffff;
      --card-inner: #f3f4f6;
      --input-bg: #ffffff;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f3f4f6;
      
      /* Primary Accents (P: Teal) */
      --neon-cyan: #2f6a87;
      --forest-green-start: #2f6a87;
      --forest-green-end: #1e4558;
      --neon-cyan-glow: rgba(47, 106, 135, 0.35);
      
      /* Tertiary Accents / Buttons (T: Orange) */
      --neon-green: #ea6c36;
      --accent-green: #ea6c36;
      --neon-green-hover: #ff8555;
      --accent-green-hover: #ff8555;
      --neon-green-glow: rgba(234, 108, 54, 0.4);
      --accent-green-light: rgba(234, 108, 54, 0.15);
      --crowd-low: #ea6c36;
      --crowd-mid: #eab308;
      --crowd-high: #ef4444;

      /* Text Colors (Dark for Light Theme) */
      --text-main: #1f2937;
      --text-primary: #1f2937;
      --text-muted: #4b5563;
      --text-secondary: #4b5563;
      --text-dim: #6b7280;
      
      /* Borders */
      --input-border: #d1d5db;
      --border-color: #d1d5db;
      --border-dim: #e5e7eb;
      --border-subtle: #e5e7eb;
      --border-active: #2f6a87;

      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-full: 9999px;

      --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.1);

      --font-main: 'Plus Jakarta Sans', 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }"""

def replace_root_vars(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace existing :root with our universal light theme root
    new_content = re.sub(r':root\s*\{[^}]*\}', light_theme_root, content, count=1)
    
    # Let's also fix hardcoded colors in some files
    if 'nutrition.html' in filepath:
        new_content = re.sub(r'background:#08111f', r'background:var(--bg-outside)', new_content)
        new_content = re.sub(r'background:#0b1220', r'background:var(--app-bg)', new_content)
        new_content = re.sub(r'background:#0f172a', r'background:var(--card-bg)', new_content)
        new_content = re.sub(r'background:#0d182b', r'background:var(--card-inner)', new_content)
        new_content = re.sub(r'border-bottom:1px solid #263244', r'border-bottom:1px solid var(--border-color)', new_content)
        new_content = re.sub(r'border:1px solid #263244', r'border:1px solid var(--border-color)', new_content)
        new_content = re.sub(r'background:#121e33', r'background:var(--card-bg)', new_content)
        new_content = re.sub(r'background:#1c2d4a', r'background:var(--card-inner)', new_content)
        new_content = re.sub(r'color:#[fF]{3,6}', r'color:var(--text-main)', new_content)
        new_content = re.sub(r'color:#e0e0e0', r'color:var(--text-muted)', new_content)
        
    # Replace hardcoded SVG strokes and fills
    new_content = re.sub(r'stroke="#38f28d"', r'stroke="var(--neon-green)"', new_content)
    new_content = re.sub(r'stroke="#00f2fe"', r'stroke="var(--neon-cyan)"', new_content)
    new_content = re.sub(r'fill="#38f28d"', r'fill="var(--neon-green)"', new_content)
    new_content = re.sub(r'fill="#00f2fe"', r'fill="var(--neon-cyan)"', new_content)
    new_content = re.sub(r'color:\s*#fff(?:fff)?', r'color: var(--text-main)', new_content)
    new_content = re.sub(r'color:\s*#000(?:000)?', r'color: var(--card-bg)', new_content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

files_to_update = [
    'c:/Users/sandhiya/Desktop/dharsh/templates/dashboard.html',
    'c:/Users/sandhiya/Desktop/dharsh/templates/fitness.html',
    'c:/Users/sandhiya/Desktop/dharsh/templates/youtube.html',
    'c:/Users/sandhiya/Desktop/dharsh/templates/nutrition.html',
    'c:/Users/sandhiya/Desktop/dharsh/static/hackpro/css/style.css',
    'c:/Users/sandhiya/Desktop/dharsh/static/stressless/css/style.css',
    'c:/Users/sandhiya/Desktop/dharsh/hackpro/static/css/style.css',
    'c:/Users/sandhiya/Desktop/dharsh/stressless/static/css/style.css'
]

for filepath in files_to_update:
    replace_root_vars(filepath)

print("Applied Light Palette successfully.")
