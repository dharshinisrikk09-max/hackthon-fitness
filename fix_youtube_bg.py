import re

filepath = 'c:/Users/sandhiya/Desktop/dharsh/templates/youtube.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded dark gradient with simple variable
content = re.sub(r'background-color: var\(--bg-dark\);[\s\S]*?linear-gradient\([^)]+\);', r'background-color: var(--app-bg);', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("youtube.html fixed.")
