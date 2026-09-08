/* checkin.js — drives the multi-step check-in experience on checkin.html */

(() => {
  // Each question: id used as API key, prompt text, and either 'emoji' or 'slider' type.
  // For emoji-type questions, values map from calm(0) -> stressed(10).
  const QUESTIONS = [
    {
      id: "mood", title: "How's your mood right now?", type: "emoji",
      options: [
        { emoji: "😄", label: "Great", value: 0 },
        { emoji: "🙂", label: "Good", value: 2.5 },
        { emoji: "😐", label: "Okay", value: 5 },
        { emoji: "😕", label: "Low", value: 7.5 },
        { emoji: "😩", label: "Rough", value: 10 },
      ],
    },
    {
      id: "sleep", title: "How was your sleep quality?", type: "emoji",
      options: [
        { emoji: "😴", label: "Great", value: 0 },
        { emoji: "🙂", label: "Okay", value: 2.5 },
        { emoji: "😐", label: "Meh", value: 5 },
        { emoji: "🥱", label: "Poor", value: 7.5 },
        { emoji: "😵", label: "Terrible", value: 10 },
      ],
    },
    {
      id: "energy", title: "What's your energy level?", type: "emoji",
      options: [
        { emoji: "⚡", label: "High", value: 0 },
        { emoji: "🙂", label: "Good", value: 2.5 },
        { emoji: "😐", label: "Medium", value: 5 },
        { emoji: "🔋", label: "Low", value: 7.5 },
        { emoji: "🪫", label: "Empty", value: 10 },
      ],
    },
    {
      id: "pressure", title: "How much study/work pressure are you feeling?", type: "slider",
      low: "None at all", high: "Extremely high",
    },
    {
      id: "concentration", title: "How hard is it to concentrate right now?", type: "slider",
      low: "Very easy to focus", high: "Very hard to focus",
    },
    {
      id: "overwhelmed", title: "Do you feel overwhelmed?", type: "slider",
      low: "Not at all", high: "Completely overwhelmed",
    },
    {
      id: "tiredness", title: "How physically tired do you feel?", type: "slider",
      low: "Fully rested", high: "Exhausted",
    },
    {
      id: "overall", title: "Overall, how stressed do you feel today?", type: "slider",
      low: "Totally relaxed", high: "Very stressed",
    },
  ];

  const answers = {};
  let stepIndex = 0;

  const stage = document.getElementById("questionStage");
  const progressBar = document.getElementById("progressBar");

  function renderStep() {
    const q = QUESTIONS[stepIndex];
    progressBar.style.width = `${((stepIndex) / QUESTIONS.length) * 100 + 6}%`;

    let bodyHtml = "";
    if (q.type === "emoji") {
      bodyHtml = `
        <div class="emoji-scale">
          ${q.options.map(o => `
            <div class="emoji-option" data-value="${o.value}">
              ${o.emoji}
              <span>${o.label}</span>
            </div>`).join("")}
        </div>`;
    } else {
      const current = answers[q.id] ?? 5;
      bodyHtml = `
        <div class="slider-row">
          <input type="range" min="0" max="10" step="1" value="${current}" id="sliderInput">
          <div class="slider-labels"><span>${q.low}</span><span>${q.high}</span></div>
        </div>`;
    }

    stage.innerHTML = `
      <div class="question-card">
        <h2>${q.title}</h2>
        <p class="question-sub">Question ${stepIndex + 1} of ${QUESTIONS.length}</p>
        ${bodyHtml}
        <div class="checkin-nav">
          <button class="btn btn-ghost" id="prevBtn" ${stepIndex === 0 ? "disabled" : ""}>← Back</button>
          <button class="btn btn-primary" id="nextBtn">${stepIndex === QUESTIONS.length - 1 ? "See My Score ✨" : "Next →"}</button>
        </div>
      </div>`;

    if (q.type === "emoji") {
      const opts = stage.querySelectorAll(".emoji-option");
      opts.forEach(el => {
        if (parseFloat(el.dataset.value) === answers[q.id]) el.classList.add("selected");
        el.addEventListener("click", () => {
          opts.forEach(o => o.classList.remove("selected"));
          el.classList.add("selected");
          answers[q.id] = parseFloat(el.dataset.value);
        });
      });
      if (answers[q.id] === undefined) answers[q.id] = q.options[2].value; // default to middle
    } else {
      const slider = document.getElementById("sliderInput");
      answers[q.id] = parseInt(slider.value, 10);
      slider.addEventListener("input", () => { answers[q.id] = parseInt(slider.value, 10); });
    }

    document.getElementById("prevBtn").addEventListener("click", () => {
      if (stepIndex > 0) { stepIndex--; renderStep(); }
    });
    document.getElementById("nextBtn").addEventListener("click", () => {
      if (stepIndex < QUESTIONS.length - 1) { stepIndex++; renderStep(); }
      else { submitCheckin(); }
    });
  }

  async function submitCheckin() {
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.disabled = true;
    nextBtn.textContent = "Calculating...";
    try {
      const result = await StressLess.post("/api/stress-score", answers);
      progressBar.style.width = "100%";
      showScore(result);
    } catch (e) {
      StressLess.toast("Something went wrong — please try again.");
      nextBtn.disabled = false;
      nextBtn.textContent = "See My Score ✨";
    }
  }

  function showScore(result) {
    stage.style.display = "none";
    const scoreStage = document.getElementById("scoreStage");
    scoreStage.style.display = "block";
    scoreStage.className = `question-card category-${result.category}`;

    StressLess.setState("checkin_id", result.checkin_id);
    StressLess.setState("score", result.score);
    StressLess.setState("category", result.category);

    if (result.show_support) {
      document.getElementById("supportNotice").style.display = "block";
    }

    const circumference = 2 * Math.PI * 80;
    const fg = document.getElementById("scoreRingFg");
    fg.style.strokeDasharray = circumference;
    fg.style.strokeDashoffset = circumference;

    document.getElementById("scoreCat").textContent = result.category;
    let n = 0;
    const target = result.score;
    const anim = setInterval(() => {
      n += Math.ceil(target / 30);
      if (n >= target) { n = target; clearInterval(anim); }
      document.getElementById("scoreNum").textContent = n;
      const offset = circumference - (n / 100) * circumference;
      fg.style.strokeDashoffset = offset;
    }, 25);
  }

  // ---------------- Interests stage ----------------
  const selectedInterests = new Set();
  document.getElementById("toInterestsBtn").addEventListener("click", () => {
    document.getElementById("scoreStage").style.display = "none";
    document.getElementById("interestStage").style.display = "block";
  });
  document.getElementById("backToScoreBtn").addEventListener("click", () => {
    document.getElementById("interestStage").style.display = "none";
    document.getElementById("scoreStage").style.display = "block";
  });

  document.querySelectorAll(".interest-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.key;
      if (selectedInterests.has(key)) {
        selectedInterests.delete(key);
        chip.classList.remove("selected");
      } else {
        selectedInterests.add(key);
        chip.classList.add("selected");
      }
    });
  });

  document.getElementById("getRecBtn").addEventListener("click", async () => {
    if (selectedInterests.size === 0) {
      StressLess.toast("Pick at least one thing you feel like doing 🙂");
      return;
    }
    const category = StressLess.getState("category", "moderate");
    try {
      const res = await StressLess.post("/api/recommendation", {
        category, interests: Array.from(selectedInterests),
      });
      showRecommendation(res.recommendation);
    } catch (e) {
      StressLess.toast("Couldn't fetch a recommendation — try again.");
    }
  });

  function showRecommendation(rec) {
    document.getElementById("interestStage").style.display = "none";
    document.getElementById("recStage").style.display = "block";

    document.getElementById("recEmoji").textContent = rec.primary.emoji;
    document.getElementById("recMessage").textContent = rec.message;

    const startBtn = document.getElementById("startActivityBtn");
    startBtn.textContent = `Yes, start ${rec.primary.label} →`;
    startBtn.href = rec.primary.key === "journaling" ? "/journal" : `/activity/${rec.primary.route}`;

    // Use the dynamic question from the backend — specific to the user's chosen activity
    document.getElementById("recPrompt").textContent = rec.dynamic_question;

    if (rec.followup) {
      const f = document.getElementById("recFollowup");
      f.style.display = "block";
      f.textContent = rec.followup;
    }

    // "No thanks" button — go back to interest selection, NOT to a forced activity
    const skipBtn = document.getElementById("skipActivityBtn");
    skipBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("recStage").style.display = "none";
      document.getElementById("interestStage").style.display = "block";
    });

    // "Skip to Dashboard" link — lets the user leave entirely if they want
    const dashBtn = document.getElementById("skipToDashBtn");
    if (dashBtn) {
      dashBtn.href = "/dashboard";
    }
  }

  renderStep();
})();
