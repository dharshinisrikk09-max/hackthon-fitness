/**
 * AuraFit AI Coach - Client-Side Interactive Fitness Intelligence
 * 100% Independent from GPS / Location Tracking / Google Maps
 */

// Global Open/Close Handlers
function openAuraFitChat() {
  const modal = document.getElementById("aurafitChatModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    const input = document.getElementById("aurafitInput");
    if (input) {
      setTimeout(() => input.focus(), 120);
    }
  }
}

function closeAuraFitChat() {
  const modal = document.getElementById("aurafitChatModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function clearAuraFitChat() {
  const msgs = document.getElementById("aurafitMessages");
  if (msgs) {
    msgs.innerHTML = `
      <div class="aurafit-msg msg-ai">
        <div class="msg-avatar">⚡</div>
        <div class="msg-bubble">
          <strong>Chat cleared!</strong>
          <p>I'm AuraFit, your AI Coach. Ready for your next workout, diet, or form question!</p>
          <span class="msg-time">Just now</span>
        </div>
      </div>
    `;
  }
}

function sendQuickPrompt(text) {
  const input = document.getElementById("aurafitInput");
  if (input) {
    input.value = text;
    processUserMessage(text);
  }
}

function handleAuraFitSend(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("aurafitInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  processUserMessage(text);
}

function processUserMessage(text) {
  const msgs = document.getElementById("aurafitMessages");
  const typing = document.getElementById("aurafitTyping");
  if (!msgs) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Append User Message Bubble
  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "aurafit-msg msg-user";
  userMsgDiv.innerHTML = `
    <div class="msg-bubble">
      ${escapeHtml(text)}
      <span class="msg-time">${timeStr}</span>
    </div>
  `;
  msgs.appendChild(userMsgDiv);
  msgs.scrollTop = msgs.scrollHeight;

  // 2. Show Typing Indicator
  if (typing) typing.style.display = "flex";
  msgs.scrollTop = msgs.scrollHeight;

  // 3. Generate Smart AI Response (Simulated Thinking Time)
  const delay = Math.min(1100, Math.max(400, text.length * 15));
  setTimeout(() => {
    if (typing) typing.style.display = "none";

    const aiResponseHTML = generateAuraFitResponse(text);

    const aiMsgDiv = document.createElement("div");
    aiMsgDiv.className = "aurafit-msg msg-ai";
    aiMsgDiv.innerHTML = `
      <div class="msg-avatar">⚡</div>
      <div class="msg-bubble">
        <strong>AuraFit AI Coach</strong>
        ${aiResponseHTML}
        <span class="msg-time">${timeStr}</span>
      </div>
    `;
    msgs.appendChild(aiMsgDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }, delay);
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Intelligent Fitness & Nutrition Knowledge Engine
 * Purely algorithmic, instantaneous, and completely isolated from location APIs.
 */
function generateAuraFitResponse(query) {
  const q = query.toLowerCase();

  // 1. FAT LOSS / CARDIO / WEIGHT LOSS
  if (q.includes("fat burn") || q.includes("weight loss") || q.includes("lose weight") || q.includes("cut") || q.includes("cutting") || q.includes("cardio")) {
    return `
      <p>Here is an optimal fat-loss strategy backed by exercise science:</p>
      <ul>
        <li><strong>Caloric Deficit:</strong> Aim for a sustainable 300–500 kcal daily deficit below maintenance (TDEE).</li>
        <li><strong>Resistance Training:</strong> Lift heavy 3–4x/week to preserve lean muscle mass while burning calories.</li>
        <li><strong>Zone 2 Cardio:</strong> 30–45 mins of incline walking or light jogging at 60–70% max heart rate burns fat efficiently without spiking cortisol.</li>
        <li><strong>Protein Priority:</strong> Maintain 1.6g–2.0g protein per kg of bodyweight to stay full and protect muscles.</li>
      </ul>
      <p>Consistency is key—track your meals on our <em>Smart Fuel Nutrition</em> tab for automated targets!</p>
    `;
  }

  // 2. SQUAT / DEADLIFT / FORM / INJURY CHECK
  if (q.includes("squat") || q.includes("deadlift") || q.includes("bench") || q.includes("form") || q.includes("technique") || q.includes("posture")) {
    return `
      <p>Mastering compound form prevents injury and maximizes gains:</p>
      <ul>
        <li><strong>Squat Cues:</strong> Set feet shoulder-width, toes slightly flared (15–30°). Brace your core (Valsalva maneuver), push hips back, and ensure knees track in line with toes. Break parallel with a neutral spine.</li>
        <li><strong>Deadlift Cues:</strong> Bar over mid-foot. Hinge at the hips, pull the slack out of the barbell, squeeze your lats like squeezing oranges in your armpits, and drive through the floor.</li>
        <li><strong>Bench Press Cues:</strong> Retract and depress scapulae. Keep feet planted on the floor for leg drive, and touch lower sternum under control.</li>
      </ul>
      <p>💡 Check out the <em>YouTube Vault</em> on the top menu for 50+ video tutorials with visual cues!</p>
    `;
  }

  // 3. PROTEIN / MEAL / DIET / NUTRITION / CALORIES
  if (q.includes("meal") || q.includes("protein") || q.includes("diet") || q.includes("calorie") || q.includes("food") || q.includes("eat") || q.includes("nutrition")) {
    return `
      <p>Solid nutrition fuels your performance:</p>
      <ul>
        <li><strong>Daily Protein Goal:</strong> Target <strong>1.6g to 2.2g per kg</strong> of bodyweight (e.g., 70kg = 112g–150g protein/day).</li>
        <li><strong>Pre-Workout (60–90m prior):</strong> Easily digestible carbs + moderate protein (e.g., Oatmeal with banana & whey, or whole grain toast with egg whites).</li>
        <li><strong>Post-Workout (Within 2 hrs):</strong> 25–35g protein + complex carbs to trigger muscle protein synthesis (e.g., Grilled chicken with rice, tofu quinoa bowl, or whey shake with Greek yogurt).</li>
        <li><strong>Hydration:</strong> Drink 3–4 liters of water daily, especially around training windows.</li>
      </ul>
    `;
  }

  // 4. RECOVERY / SLEEP / SORENESS
  if (q.includes("recovery") || q.includes("sleep") || q.includes("sore") || q.includes("rest") || q.includes("doms") || q.includes("water")) {
    return `
      <p>Muscles grow during recovery, not in the gym:</p>
      <ul>
        <li><strong>Sleep:</strong> 7–9 hours of quality sleep maximizes natural growth hormone release and central nervous system recovery.</li>
        <li><strong>DOMS (Muscle Soreness):</strong> Light active recovery (e.g., 20m brisk walking, gentle stretching) increases blood flow to flush metabolic waste.</li>
        <li><strong>Electrolytes:</strong> Ensure adequate sodium, potassium, and magnesium intake to prevent cramping.</li>
        <li><strong>Mindfulness:</strong> Lowering stress hormones (cortisol) speeds recovery—check our <em>StressLess</em> tab for guided breathing!</li>
      </ul>
    `;
  }

  // 5. GYM OR LOCATION INQUIRY (TEXT ONLY - NO GPS / NO LOCATION HOOK)
  if (q.includes("gym") || q.includes("location") || q.includes("where") || q.includes("near") || q.includes("map") || q.includes("locate")) {
    return `
      <p>Looking for a workout facility? 📍</p>
      <p>You can discover verified fitness centers, public parks, and running tracks on our <strong>Workouts & Gyms</strong> page:</p>
      <ul>
        <li>Click <strong>Workouts</strong> in the top menu to view the full interactive map.</li>
        <li>Whenever you want to check local gyms near you, simply tap the dedicated <strong>"Locate Me"</strong> button on that page!</li>
      </ul>
    `;
  }

  // 6. MOTIVATION / GENERAL
  return `
    <p>That's a great fitness question! Here are key recommendations to keep in mind:</p>
    <ul>
      <li><strong>Progressive Overload:</strong> Gradually increase weight, reps, or volume every week to ensure continuous adaptation.</li>
      <li><strong>Consistency Over Intensity:</strong> Showing up 4 days a week consistently outperforms sporadic 7-day burnout cycles.</li>
      <li><strong>Form First:</strong> Controlled eccentric phase (2–3 seconds down) activates up to 40% more muscle fibers.</li>
    </ul>
    <p>Feel free to ask me about specific routines (Push/Pull/Legs, HIIT), meal ideas, or form breakdowns!</p>
  `;
}
