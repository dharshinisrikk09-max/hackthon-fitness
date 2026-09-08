import re
import os

filepath = 'c:/Users/sandhiya/Desktop/dharsh/templates/dashboard.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add cursor pointer and onclick to cards
replacements = [
    (r'<!-- CARD 1: Smart Fuel Nutrition -->\s*<div class="card">', 
     '<!-- CARD 1: Smart Fuel Nutrition -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/nutrition\'">'),
     
    (r'<!-- CARD 2: ProCoach Elite -->\s*<div class="card">', 
     '<!-- CARD 2: ProCoach Elite -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/experts\'">'),
     
    (r'<!-- CARD 3: GymRadar GPS -->\s*<div class="card">', 
     '<!-- CARD 3: GymRadar GPS -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/fitness\'">'),
     
    (r'<!-- CARD 4: AuraFit AI Coach -->\s*<div class="card">', 
     '<!-- CARD 4: AuraFit AI Coach -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/fitness\'">'),
     
    (r'<!-- CARD 5: ZenPulse Mind & Recovery -->\s*<div class="card">', 
     '<!-- CARD 5: ZenPulse Mind & Recovery -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/stressless\'">'),
     
    (r'<!-- CARD 6: YouTube Workout Vault -->\s*<div class="card">', 
     '<!-- CARD 6: YouTube Workout Vault -->\n          <div class="card" style="cursor: pointer;" onclick="window.location.href=\'/youtube\'">')
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Now, to prevent buttons inside from firing the card click (if they have their own alerts)
# e.g. <button class="btn-book" onclick="alert('Session Booked!')">
# We can change it to: onclick="event.stopPropagation(); alert(...)"
content = content.replace('onclick="alert(', 'onclick="event.stopPropagation(); alert(')
# Same for yt tabs
content = content.replace('onclick="switchYtVideo', 'onclick="event.stopPropagation(); switchYtVideo')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cards updated successfully.")
