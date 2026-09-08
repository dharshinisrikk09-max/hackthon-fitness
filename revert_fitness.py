import re
import os

original_fitness_css = """    :root {
      --bg-primary: #090e1a;
      --bg-surface: #10192d;
      --bg-surface-elevated: #16223b;
      --bg-input: #141f35;
      --border-color: #202e49;
      
      --accent-green: #22c55e;
      --accent-green-hover: #16a34a;
      --accent-green-light: rgba(34, 197, 94, 0.15);
      --forest-green-start: #14532d;
      --forest-green-end: #166534;

      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;

      --crowd-low: #22c55e;
      --crowd-mid: #eab308;
      --crowd-high: #ef4444;

      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-full: 9999px;

      --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);

      --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }"""

def revert_fitness(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the current :root { ... } with the original
    new_content = re.sub(r':root\s*\{[^}]*\}', original_fitness_css, content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

revert_fitness('c:/Users/sandhiya/Desktop/dharsh/fitness.html')
revert_fitness('c:/Users/sandhiya/Desktop/dharsh/templates/fitness.html')

print("Fitness CSS reverted.")
