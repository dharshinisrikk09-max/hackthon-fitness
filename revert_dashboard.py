import re
import os

original_dashboard_css = """    :root {
      --bg-outside: #0b0f14;
      --app-bg: #10151d;
      --sidebar-bg: #0d1219;
      --card-bg: #141b24;
      --card-inner: #19222e;
      --input-bg: #161d27;
      --input-border: #222d3d;
      --neon-green: #38f28d;
      --neon-green-hover: #4efc9d;
      --neon-green-glow: rgba(56, 242, 141, 0.4);
      --neon-cyan: #00f2fe;
      --neon-cyan-glow: rgba(0, 242, 254, 0.35);
      --border-color: rgba(56, 242, 141, 0.35);
      --border-dim: rgba(255, 255, 255, 0.08);
      --text-main: #ffffff;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }"""

def revert_dashboard(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the current :root { ... } with the original
    new_content = re.sub(r':root\s*\{[^}]*\}', original_dashboard_css, content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

revert_dashboard('c:/Users/sandhiya/Desktop/dharsh/dashboard.html')
revert_dashboard('c:/Users/sandhiya/Desktop/dharsh/templates/dashboard.html')

print("Dashboard CSS reverted.")
