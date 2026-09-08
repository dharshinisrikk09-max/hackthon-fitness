/* activity.js — powers every interactive activity page */

(() => {
  const activityType = document.querySelector(".breathing-stage").dataset.activity;
  let durationMinutes = 1; // default, overwritten by duration pickers

  const beforeScore = StressLess.getState("score", 50);
  const checkinId = StressLess.getState("checkin_id", null);

  function fmt(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function showAfterStage() {
    document.getElementById("afterStage").style.display = "block";
    document.getElementById("afterStage").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---------------- Shared completion / before-after ----------------
  document.getElementById("submitAfterBtn")?.addEventListener("click", async () => {
    const afterSliderVal = parseInt(document.getElementById("afterSlider").value, 10);
    const afterScore = afterSliderVal * 10; // scale 0-10 -> 0-100 to match check-in scale

    try {
      const res = await StressLess.post("/api/activity-complete", {
        checkin_id: checkinId,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        before_score: beforeScore,
        after_score: afterScore,
      });
      renderResult(res, beforeScore, afterScore);
    } catch (e) {
      StressLess.toast("Couldn't save your result, but great job anyway! 💛");
    }
  });

  function renderResult(res, before, after) {
    document.getElementById("afterStage").style.display = "none";
    document.getElementById("resultStage").style.display = "block";
    document.getElementById("beforeVal").textContent = before;
    document.getElementById("afterVal").textContent = after;

    const diff = res.difference ?? (before - after);
    let headline = "Nice! Your stress level changed after the activity.";
    let emoji = "🎉";
    if (diff > 10) { headline = "Great job! That's a well-deserved reset."; emoji = "🌟"; }
    else if (diff > 0) { headline = "Nice, a little lighter than before!"; emoji = "🙂"; }
    else if (diff === 0) { headline = "Steady as you are — that's okay too."; emoji = "🌿"; }
    else { headline = "Some days are just like that — be kind to yourself."; emoji = "💛"; }

    document.getElementById("resultEmoji").textContent = emoji;
    document.getElementById("resultHeadline").textContent = headline;
    document.getElementById("resultMessage").textContent =
      "You gave yourself a moment of care today — that always counts.";
    document.getElementById("pointsMessage").textContent = `+${res.points_earned} points · 🔥 ${res.streak}-day streak`;

    if (res.new_badges && res.new_badges.length) {
      const badgeBox = document.getElementById("badgeCallout");
      badgeBox.style.display = "block";
      badgeBox.innerHTML = res.new_badges
        .map(b => `<span class="badge-pill earned">${b.emoji} ${b.label}</span>`)
        .join(" ");
      StressLess.toast(`New badge unlocked: ${res.new_badges[0].emoji} ${res.new_badges[0].label}!`);
    }
    document.getElementById("resultStage").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // =====================================================================
  // BREATHING
  // =====================================================================
  if (activityType === "breathing") {
    document.querySelectorAll(".dur-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        durationMinutes = parseInt(btn.dataset.min, 10);
        document.getElementById("durationStage").style.display = "none";
        document.getElementById("breathingRun").style.display = "block";
        runBreathing(durationMinutes * 60);
      });
    });

    let breathTimerId = null;
    function runBreathing(totalSeconds) {
      const circle = document.getElementById("breathCircle");
      const instruction = document.getElementById("breathInstruction");
      const timerEl = document.getElementById("breathTimer");
      let remaining = totalSeconds;
      const cyclePhases = [
        { name: "Inhale", cls: "inhale", dur: 4 },
        { name: "Hold", cls: "hold", dur: 4 },
        { name: "Exhale", cls: "exhale", dur: 4 },
      ];
      let phaseIdx = 0, phaseElapsed = 0;

      function tick() {
        if (remaining <= 0) { finishBreathing(); return; }
        const phase = cyclePhases[phaseIdx];
        if (phaseElapsed === 0) {
          instruction.textContent = phase.name;
          circle.className = "breath-circle " + phase.cls;
        }
        timerEl.textContent = fmt(remaining);
        remaining -= 1;
        phaseElapsed += 1;
        if (phaseElapsed >= phase.dur) {
          phaseElapsed = 0;
          phaseIdx = (phaseIdx + 1) % cyclePhases.length;
        }
      }
      tick();
      breathTimerId = setInterval(tick, 1000);
    }
    function finishBreathing() {
      clearInterval(breathTimerId);
      document.getElementById("breathInstruction").textContent = "All done 🌿";
      document.getElementById("breathTimer").textContent = "00:00";
      showAfterStage();
    }
    document.getElementById("stopBreathBtn").addEventListener("click", finishBreathing);
  }

  // =====================================================================
  // MEDITATION
  // =====================================================================
  if (activityType === "meditation") {
    const lines = [
      "Settle into your seat, let your shoulders drop.",
      "Notice your breath, without changing it.",
      "Let your thoughts pass by like clouds.",
      "Feel the weight of your body supported beneath you.",
      "Bring a small kindness to how you're feeling right now.",
      "Whenever you're ready, gently return to the room.",
    ];
    document.querySelectorAll(".dur-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        durationMinutes = parseInt(btn.dataset.min, 10);
        document.getElementById("durationStage").style.display = "none";
        document.getElementById("meditationRun").style.display = "block";
        runMeditation(durationMinutes * 60);
      });
    });

    let medTimerId = null, breathePulse = null;
    function runMeditation(totalSeconds) {
      const timerEl = document.getElementById("medTimer");
      const instruction = document.getElementById("medInstruction");
      const circle = document.getElementById("medCircle");
      let remaining = totalSeconds;
      const lineInterval = Math.max(4, Math.floor(totalSeconds / lines.length));
      let lineIdx = 0;
      instruction.textContent = lines[0];

      let pulseUp = true;
      breathePulse = setInterval(() => {
        circle.style.transform = pulseUp ? "scale(1.5)" : "scale(1.1)";
        pulseUp = !pulseUp;
      }, 5000);

      medTimerId = setInterval(() => {
        remaining -= 1;
        timerEl.textContent = fmt(remaining);
        if (remaining % lineInterval === 0 && lineIdx < lines.length - 1) {
          lineIdx += 1;
          instruction.textContent = lines[lineIdx];
        }
        if (remaining <= 0) finishMeditation();
      }, 1000);
    }
    function finishMeditation() {
      clearInterval(medTimerId);
      clearInterval(breathePulse);
      document.getElementById("medInstruction").textContent = "Gently return whenever you're ready 🌸";
      showAfterStage();
    }
    document.getElementById("stopMedBtn").addEventListener("click", finishMeditation);
  }

  // =====================================================================
  // MUSIC — lightweight in-browser ambient sound generator (no files needed).
  // Structured so real royalty-free mp3s can be dropped into /static/stressless/audio/
  // and swapped in later (see comment at bottom).
  // =====================================================================
  if (activityType === "music") {
    let audioCtx = null;
    const playing = {}; // sound key -> { source, gain }

    function getCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }

    function makeNoiseBuffer(ctx, color) {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (color === "brown") {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (color === "pink") {
          lastOut = 0.98 * lastOut + white * 0.02;
          data[i] = (lastOut + white * 0.15);
        } else {
          data[i] = white * 0.3;
        }
      }
      return buffer;
    }

    function startSound(key) {
      const ctx = getCtx();
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);

      if (key === "calm") {
        // soft two-note pad using slow oscillators instead of noise
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine"; osc1.frequency.value = 220;
        osc2.type = "sine"; osc2.frequency.value = 277;
        const g2 = ctx.createGain(); g2.gain.value = 0.15;
        osc1.connect(g2); osc2.connect(g2); g2.connect(gain);
        osc1.start(); osc2.start();
        playing[key] = { nodes: [osc1, osc2], gain };
      } else {
        const colorMap = { nature: "pink", rain: "white", focus: "brown" };
        const buffer = makeNoiseBuffer(ctx, colorMap[key] || "white");
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = key === "rain" ? 1800 : 3000;
        source.connect(filter).connect(gain);
        source.start();
        playing[key] = { nodes: [source], gain };
      }
    }

    function stopSound(key) {
      const p = playing[key];
      if (!p) return;
      p.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
      delete playing[key];
    }

    document.querySelectorAll(".sound-card").forEach(card => {
      const key = card.dataset.sound;
      const btn = card.querySelector(".play-btn");
      const vol = card.querySelector(".vol-slider");
      btn.addEventListener("click", () => {
        if (playing[key]) {
          stopSound(key);
          btn.textContent = "▶";
        } else {
          startSound(key);
          playing[key].gain.gain.value = vol.value / 100;
          btn.textContent = "⏸";
        }
      });
      vol.addEventListener("input", () => {
        if (playing[key]) playing[key].gain.gain.value = vol.value / 100;
      });
    });

    document.getElementById("musicDoneBtn").addEventListener("click", () => {
      Object.keys(playing).forEach(stopSound);
      durationMinutes = 2;
      showAfterStage();
    });
    /* To use real audio files later:
       <audio id="a-nature" src="/static/stressless/audio/nature.mp3" loop></audio>
       and swap startSound/stopSound to call .play()/.pause() on that element. */
  }

  // =====================================================================
  // GAMES
  // =====================================================================
  if (activityType === "games") {
    const picker = document.getElementById("gamePicker");
    const gameArea = document.getElementById("gameArea");
    const canvasWrap = document.getElementById("gameCanvasWrap");
    const gameLabel = document.getElementById("gameLabel");
    const gameScore = document.getElementById("gameScore");
    let activeCleanup = null;

    document.querySelectorAll(".game-pick").forEach(btn => {
      btn.addEventListener("click", () => {
        picker.style.display = "none";
        gameArea.style.display = "block";
        durationMinutes = 2;
        const game = btn.dataset.game;
        if (game === "stars") startStars();
        if (game === "color") startColor();
        if (game === "memory") startMemory();
        if (game === "reaction") startReaction();
      });
    });

    document.getElementById("gameDoneBtn").addEventListener("click", () => {
      if (activeCleanup) activeCleanup();
      showAfterStage();
    });

    function clearCanvas() { canvasWrap.innerHTML = ""; }

    // ---- Game 1: Catch the falling stars ----
    function startStars() {
      clearCanvas();
      gameLabel.textContent = "✨ Catch the Stars";
      let score = 0;
      gameScore.textContent = "Caught: 0";
      const interval = setInterval(() => {
        const star = document.createElement("div");
        star.className = "game-star";
        star.textContent = "⭐";
        star.style.fontSize = "1.8rem";
        star.style.left = Math.random() * 90 + "%";
        star.style.top = "-30px";
        star.style.transition = "top 4s linear";
        canvasWrap.appendChild(star);
        requestAnimationFrame(() => { star.style.top = "100%"; });
        star.addEventListener("click", () => {
          score++;
          gameScore.textContent = "Caught: " + score;
          star.remove();
        });
        setTimeout(() => star.remove(), 4200);
      }, 700);
      activeCleanup = () => clearInterval(interval);
    }

    // ---- Game 2: Tap the correct color ----
    function startColor() {
      clearCanvas();
      gameLabel.textContent = "🎨 Tap the Color";
      let score = 0;
      gameScore.textContent = "Score: 0";
      const colors = ["#7FE6C0", "#8FD3FF", "#C9B6FF", "#FFC3A0", "#FF8A8A", "#FFE066"];
      const names = ["Mint", "Sky", "Lavender", "Peach", "Coral", "Sunny"];

      function round() {
        canvasWrap.innerHTML = "";
        const targetIdx = Math.floor(Math.random() * colors.length);
        const prompt = document.createElement("div");
        prompt.style.textAlign = "center";
        prompt.style.padding = "14px";
        prompt.style.fontWeight = "700";
        prompt.textContent = `Tap: ${names[targetIdx]}`;
        canvasWrap.appendChild(prompt);

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(3, 1fr)";
        grid.style.gap = "10px";
        grid.style.padding = "10px";
        const shuffled = [...colors.keys()].sort(() => Math.random() - 0.5).slice(0, 6);
        if (!shuffled.includes(targetIdx)) shuffled[0] = targetIdx;
        shuffled.forEach(idx => {
          const tile = document.createElement("div");
          tile.style.height = "70px";
          tile.style.borderRadius = "12px";
          tile.style.cursor = "pointer";
          tile.style.background = colors[idx];
          tile.addEventListener("click", () => {
            if (idx === targetIdx) { score++; gameScore.textContent = "Score: " + score; }
            round();
          });
          grid.appendChild(tile);
        });
        canvasWrap.appendChild(grid);
      }
      round();
      activeCleanup = () => {};
    }

    // ---- Game 3: Memory match ----
    function startMemory() {
      clearCanvas();
      gameLabel.textContent = "🧠 Memory Match";
      const icons = ["🌸", "🌿", "🌊", "☀️", "🌙", "🍃", "🌸", "🌿", "🌊", "☀️", "🌙", "🍃"];
      const shuffled = icons.sort(() => Math.random() - 0.5);
      const grid = document.createElement("div");
      grid.className = "memory-grid";
      let flipped = [];
      let matched = 0;
      gameScore.textContent = "Matches: 0";

      shuffled.forEach((icon, i) => {
        const card = document.createElement("div");
        card.className = "memory-card";
        card.dataset.icon = icon;
        card.textContent = "🌀";
        card.addEventListener("click", () => {
          if (card.classList.contains("flipped") || card.classList.contains("matched") || flipped.length === 2) return;
          card.textContent = icon;
          card.classList.add("flipped");
          flipped.push(card);
          if (flipped.length === 2) {
            setTimeout(() => {
              if (flipped[0].dataset.icon === flipped[1].dataset.icon) {
                flipped.forEach(c => c.classList.add("matched"));
                matched++;
                gameScore.textContent = "Matches: " + matched;
              } else {
                flipped.forEach(c => { c.classList.remove("flipped"); c.textContent = "🌀"; });
              }
              flipped = [];
            }, 700);
          }
        });
        grid.appendChild(card);
      });
      canvasWrap.appendChild(grid);
      activeCleanup = () => {};
    }

    // ---- Game 4: Reaction calm (gentle reaction game, not competitive) ----
    function startReaction() {
      clearCanvas();
      gameLabel.textContent = "⚡ Reaction Calm";
      gameScore.textContent = "";
      const box = document.createElement("div");
      box.className = "reaction-box";
      box.style.background = "#C9B6FF";
      box.textContent = "Wait for green...";
      canvasWrap.appendChild(box);
      let ready = false;
      let startTime = 0;
      let round = 0;

      function nextRound() {
        round++;
        if (round > 5) {
          box.textContent = "All done! Nicely paced 🌿";
          box.style.background = "#7FE6C0";
          activeCleanup = () => {};
          return;
        }
        ready = false;
        box.style.background = "#C9B6FF";
        box.textContent = "Wait for green...";
        const delay = 1500 + Math.random() * 2000;
        setTimeout(() => {
          ready = true;
          startTime = Date.now();
          box.style.background = "#7FE6C0";
          box.textContent = "Tap now!";
        }, delay);
      }

      box.addEventListener("click", () => {
        if (!ready) {
          box.textContent = "Oops, too soon — relax and wait 🌸";
          return;
        }
        const rt = Date.now() - startTime;
        gameScore.textContent = `Reaction: ${rt}ms`;
        nextRound();
      });
      nextRound();
      activeCleanup = () => {};
    }
  }

  // =====================================================================
  // PUZZLE
  // =====================================================================
  if (activityType === "puzzle") {
    const picker = document.getElementById("puzzlePicker");
    const puzzleArea = document.getElementById("puzzleArea");
    const puzzleBoard = document.getElementById("puzzleBoard");
    const puzzleLabel = document.getElementById("puzzleLabel");
    const puzzleProgress = document.getElementById("puzzleProgress");
    let currentPuzzleType = null;
    let puzzleRound = 0;

    document.querySelectorAll(".puzzle-pick").forEach(btn => {
      btn.addEventListener("click", () => {
        picker.style.display = "none";
        puzzleArea.style.display = "block";
        durationMinutes = 2;
        currentPuzzleType = btn.dataset.puzzle;
        puzzleRound = 0;
        if (currentPuzzleType === "pattern") startPattern();
        if (currentPuzzleType === "sequence") startSequence();
        if (currentPuzzleType === "word") startWord();
      });
    });

    document.getElementById("puzzleDoneBtn").addEventListener("click", () => {
      showAfterStage();
    });

    document.getElementById("puzzleShuffleBtn").addEventListener("click", () => {
      puzzleRound = 0;
      if (currentPuzzleType === "pattern") startPattern();
      if (currentPuzzleType === "sequence") startSequence();
      if (currentPuzzleType === "word") startWord();
    });

    document.getElementById("puzzleHintBtn").addEventListener("click", () => {
      const hintEl = puzzleBoard.querySelector(".puzzle-hint");
      if (hintEl) { hintEl.style.display = "block"; }
    });

    // ---- Pattern Match: find the odd one out ----
    function startPattern() {
      puzzleRound++;
      puzzleLabel.textContent = "🔷 Pattern Match";
      puzzleProgress.textContent = `Round ${puzzleRound}`;
      puzzleBoard.innerHTML = "";

      const groups = [
        { main: "🌸", odd: "🌺" },
        { main: "🌿", odd: "🍀" },
        { main: "🌊", odd: "💧" },
        { main: "☀️", odd: "🌤️" },
        { main: "🌙", odd: "⭐" },
        { main: "🍃", odd: "🌱" },
        { main: "🫧", odd: "💎" },
        { main: "🦋", odd: "🐛" },
      ];
      const group = groups[Math.floor(Math.random() * groups.length)];
      const gridSize = Math.min(9 + puzzleRound, 16);
      const oddIdx = Math.floor(Math.random() * gridSize);

      const prompt = document.createElement("p");
      prompt.style.cssText = "text-align:center; font-weight:700; padding:10px; font-size:1rem;";
      prompt.textContent = "Find the one that's different!";
      puzzleBoard.appendChild(prompt);

      const grid = document.createElement("div");
      grid.style.cssText = "display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:10px; max-width:360px; margin:0 auto;";

      for (let i = 0; i < gridSize; i++) {
        const tile = document.createElement("div");
        tile.style.cssText = "aspect-ratio:1; background:white; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.8rem; cursor:pointer; border:2px solid #EAF6F1; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04);";
        tile.textContent = i === oddIdx ? group.odd : group.main;
        tile.dataset.isOdd = i === oddIdx ? "true" : "false";

        tile.addEventListener("click", () => {
          if (tile.dataset.isOdd === "true") {
            tile.style.background = "#E6FBF2";
            tile.style.borderColor = "#3FCB9B";
            tile.style.transform = "scale(1.15)";
            puzzleProgress.textContent = `Round ${puzzleRound} — Correct! 🎉`;
            setTimeout(() => startPattern(), 1200);
          } else {
            tile.style.background = "#FFF0F0";
            tile.style.borderColor = "#FF8A8A";
            tile.style.transform = "scale(0.95)";
            setTimeout(() => {
              tile.style.background = "white";
              tile.style.borderColor = "#EAF6F1";
              tile.style.transform = "scale(1)";
            }, 500);
          }
        });
        tile.addEventListener("mouseenter", () => { if (tile.style.borderColor !== "rgb(63, 203, 155)") tile.style.transform = "scale(1.08)"; });
        tile.addEventListener("mouseleave", () => { if (tile.style.borderColor !== "rgb(63, 203, 155)") tile.style.transform = "scale(1)"; });
        grid.appendChild(tile);
      }
      puzzleBoard.appendChild(grid);

      const hint = document.createElement("p");
      hint.className = "puzzle-hint";
      hint.style.cssText = "display:none; text-align:center; color:#6B7280; font-size:0.88rem; margin-top:12px; padding:8px; background:#FFF7E8; border-radius:10px;";
      hint.textContent = `💡 Look for the ${group.odd} hiding among ${group.main}`;
      puzzleBoard.appendChild(hint);
    }

    // ---- Number Sequence: find the missing number ----
    function startSequence() {
      puzzleRound++;
      puzzleLabel.textContent = "🔢 Number Sequence";
      puzzleProgress.textContent = `Round ${puzzleRound}`;
      puzzleBoard.innerHTML = "";

      const patterns = [
        { name: "add2", gen: (s) => Array.from({ length: 5 }, (_, i) => s + i * 2) },
        { name: "add3", gen: (s) => Array.from({ length: 5 }, (_, i) => s + i * 3) },
        { name: "add5", gen: (s) => Array.from({ length: 5 }, (_, i) => s + i * 5) },
        { name: "double", gen: (s) => Array.from({ length: 5 }, (_, i) => s * Math.pow(2, i)) },
        { name: "add4", gen: (s) => Array.from({ length: 5 }, (_, i) => s + i * 4) },
      ];
      const pat = patterns[Math.floor(Math.random() * patterns.length)];
      const start = Math.floor(Math.random() * 5) + 1;
      const seq = pat.gen(start);
      const hideIdx = 1 + Math.floor(Math.random() * 3); // hide one of the middle values
      const answer = seq[hideIdx];

      const prompt = document.createElement("p");
      prompt.style.cssText = "text-align:center; font-weight:700; padding:10px; font-size:1rem;";
      prompt.textContent = "What number is missing?";
      puzzleBoard.appendChild(prompt);

      const seqRow = document.createElement("div");
      seqRow.style.cssText = "display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin:16px 0;";
      seq.forEach((num, i) => {
        const box = document.createElement("div");
        box.style.cssText = "width:60px; height:60px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:700; font-family:'Fredoka',sans-serif;";
        if (i === hideIdx) {
          box.style.background = "linear-gradient(135deg, #3FCB9B, #4FB8E8)";
          box.style.color = "white";
          box.textContent = "?";
          box.id = "missingBox";
        } else {
          box.style.background = "white";
          box.style.border = "2px solid #EAF6F1";
          box.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          box.textContent = num;
        }
        seqRow.appendChild(box);
      });
      puzzleBoard.appendChild(seqRow);

      // Answer choices
      const choices = [answer];
      while (choices.length < 4) {
        const c = answer + (Math.floor(Math.random() * 10) - 5);
        if (c !== answer && c > 0 && !choices.includes(c)) choices.push(c);
      }
      choices.sort(() => Math.random() - 0.5);

      const choiceRow = document.createElement("div");
      choiceRow.style.cssText = "display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:10px;";
      choices.forEach(c => {
        const btn = document.createElement("button");
        btn.style.cssText = "width:56px; height:56px; border-radius:14px; border:2px solid #EAF6F1; background:white; font-size:1.2rem; font-weight:700; cursor:pointer; transition:all 0.2s; font-family:'Fredoka',sans-serif; box-shadow:0 2px 8px rgba(0,0,0,0.04);";
        btn.textContent = c;
        btn.addEventListener("mouseenter", () => { btn.style.transform = "scale(1.08)"; });
        btn.addEventListener("mouseleave", () => { btn.style.transform = "scale(1)"; });
        btn.addEventListener("click", () => {
          if (c === answer) {
            btn.style.background = "#E6FBF2";
            btn.style.borderColor = "#3FCB9B";
            document.getElementById("missingBox").textContent = answer;
            document.getElementById("missingBox").style.background = "#E6FBF2";
            document.getElementById("missingBox").style.color = "#3FCB9B";
            puzzleProgress.textContent = `Round ${puzzleRound} — Correct! 🎉`;
            setTimeout(() => startSequence(), 1400);
          } else {
            btn.style.background = "#FFF0F0";
            btn.style.borderColor = "#FF8A8A";
            setTimeout(() => {
              btn.style.background = "white";
              btn.style.borderColor = "#EAF6F1";
            }, 500);
          }
        });
        choiceRow.appendChild(btn);
      });
      puzzleBoard.appendChild(choiceRow);

      const hint = document.createElement("p");
      hint.className = "puzzle-hint";
      hint.style.cssText = "display:none; text-align:center; color:#6B7280; font-size:0.88rem; margin-top:12px; padding:8px; background:#FFF7E8; border-radius:10px;";
      const diff = seq[1] - seq[0];
      hint.textContent = pat.name === "double" ? `💡 Each number doubles the previous one.` : `💡 The numbers increase by ${diff} each time.`;
      puzzleBoard.appendChild(hint);
    }

    // ---- Word Unscramble ----
    function startWord() {
      puzzleRound++;
      puzzleLabel.textContent = "🔤 Word Unscramble";
      puzzleProgress.textContent = `Round ${puzzleRound}`;
      puzzleBoard.innerHTML = "";

      const words = [
        { word: "CALM", hint: "A peaceful state of mind" },
        { word: "RELAX", hint: "To let go of tension" },
        { word: "PEACE", hint: "Freedom from disturbance" },
        { word: "STILL", hint: "Not moving, quiet" },
        { word: "QUIET", hint: "Making very little noise" },
        { word: "HAPPY", hint: "Feeling joy" },
        { word: "LIGHT", hint: "Not heavy, or brightness" },
        { word: "SMILE", hint: "A facial expression of joy" },
        { word: "DREAM", hint: "What happens when you sleep" },
        { word: "BLOOM", hint: "A flower opening up" },
        { word: "BREEZE", hint: "A gentle wind" },
        { word: "GENTLE", hint: "Soft and kind" },
      ];
      const entry = words[Math.floor(Math.random() * words.length)];
      const letters = entry.word.split("");
      const scrambled = [...letters].sort(() => Math.random() - 0.5);
      // Make sure scrambled is actually different
      if (scrambled.join("") === entry.word) { scrambled.reverse(); }

      const prompt = document.createElement("p");
      prompt.style.cssText = "text-align:center; font-weight:700; padding:10px; font-size:1rem;";
      prompt.textContent = "Unscramble the letters to find a calming word!";
      puzzleBoard.appendChild(prompt);

      const available = document.createElement("div");
      available.id = "scrambleLetters";
      available.style.cssText = "display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:16px 0;";

      const answer = document.createElement("div");
      answer.id = "answerSlots";
      answer.style.cssText = "display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:16px 0; min-height:56px;";

      // Create answer slots
      for (let i = 0; i < entry.word.length; i++) {
        const slot = document.createElement("div");
        slot.style.cssText = "width:46px; height:52px; border-radius:12px; border:2px dashed #C9B6FF; display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:700; font-family:'Fredoka',sans-serif; transition:all 0.2s;";
        slot.dataset.idx = i;
        slot.addEventListener("click", () => {
          // Return letter to available pool
          if (slot.textContent) {
            const letter = slot.textContent;
            slot.textContent = "";
            slot.style.background = "transparent";
            slot.style.borderStyle = "dashed";
            addLetterTile(letter);
          }
        });
        answer.appendChild(slot);
      }

      function addLetterTile(letter) {
        const tile = document.createElement("div");
        tile.style.cssText = "width:46px; height:52px; border-radius:12px; background:white; border:2px solid #EAF6F1; display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:700; cursor:pointer; transition:all 0.2s; font-family:'Fredoka',sans-serif; box-shadow:0 2px 8px rgba(0,0,0,0.04);";
        tile.textContent = letter;
        tile.addEventListener("mouseenter", () => { tile.style.transform = "scale(1.1)"; });
        tile.addEventListener("mouseleave", () => { tile.style.transform = "scale(1)"; });
        tile.addEventListener("click", () => {
          // Place letter in the first empty slot
          const slots = answer.querySelectorAll("div");
          for (const slot of slots) {
            if (!slot.textContent) {
              slot.textContent = letter;
              slot.style.background = "#F0FFFA";
              slot.style.borderStyle = "solid";
              slot.style.borderColor = "#7FE6C0";
              tile.remove();
              checkAnswer();
              break;
            }
          }
        });
        available.appendChild(tile);
      }

      scrambled.forEach(l => addLetterTile(l));

      puzzleBoard.appendChild(available);
      puzzleBoard.appendChild(answer);

      function checkAnswer() {
        const slots = answer.querySelectorAll("div");
        let current = "";
        slots.forEach(s => { current += s.textContent; });
        if (current.length === entry.word.length) {
          if (current === entry.word) {
            slots.forEach(s => {
              s.style.background = "#E6FBF2";
              s.style.borderColor = "#3FCB9B";
              s.style.borderStyle = "solid";
            });
            puzzleProgress.textContent = `Round ${puzzleRound} — Correct! 🎉`;
            setTimeout(() => startWord(), 1400);
          } else {
            slots.forEach(s => {
              s.style.background = "#FFF0F0";
              s.style.borderColor = "#FF8A8A";
            });
            setTimeout(() => {
              // Return all letters
              slots.forEach(s => {
                if (s.textContent) {
                  const l = s.textContent;
                  s.textContent = "";
                  s.style.background = "transparent";
                  s.style.borderStyle = "dashed";
                  s.style.borderColor = "#C9B6FF";
                  addLetterTile(l);
                }
              });
            }, 600);
          }
        }
      }

      const hint = document.createElement("p");
      hint.className = "puzzle-hint";
      hint.style.cssText = "display:none; text-align:center; color:#6B7280; font-size:0.88rem; margin-top:12px; padding:8px; background:#FFF7E8; border-radius:10px;";
      hint.textContent = `💡 ${entry.hint}`;
      puzzleBoard.appendChild(hint);
    }
  }

  // =====================================================================
  // MOVEMENT
  // =====================================================================
  if (activityType === "movement") {
    const steps = [15, 15, 15, 15, 20];
    let stepIdx = 0;
    document.getElementById("startMoveBtn").addEventListener("click", (e) => {
      e.target.disabled = true;
      durationMinutes = 1.5;
      runStep();
    });
    function runStep() {
      const cards = document.querySelectorAll(".step-card");
      cards.forEach(c => c.style.opacity = "0.4");
      if (stepIdx >= steps.length) {
        document.getElementById("moveTimer").textContent = "All done — nice moving! 🎉";
        showAfterStage();
        return;
      }
      cards[stepIdx].style.opacity = "1";
      cards[stepIdx].style.transform = "scale(1.02)";
      let remaining = steps[stepIdx];
      const timerEl = document.getElementById("moveTimer");
      const t = setInterval(() => {
        timerEl.textContent = `Step ${stepIdx + 1} — ${remaining}s`;
        remaining--;
        if (remaining < 0) {
          clearInterval(t);
          stepIdx++;
          runStep();
        }
      }, 1000);
    }
  }

  // =====================================================================
  // POSITIVE
  // =====================================================================
  if (activityType === "positive") {
    document.getElementById("positiveDoneBtn").addEventListener("click", () => {
      durationMinutes = 1;
      showAfterStage();
    });
  }
})();
