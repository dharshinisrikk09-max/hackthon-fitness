import os
import glob

files = glob.glob('c:/Users/sandhiya/Desktop/dharsh/templates/stressless/*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('{% extends "base.html" %}', '{% extends "stressless/base.html" %}')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print("Done fixing extends.")
