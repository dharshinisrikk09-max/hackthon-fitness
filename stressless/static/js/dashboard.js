/* dashboard.js — loads /api/dashboard and paints all the cards */

(async () => {
  try {
    const data = await StressLess.get("/api/dashboard");
    if (!data.ok) return;

    document.getElementById("dCurrentScore").textContent = data.current_score ?? "–";
    document.getElementById("dCurrentCategory").textContent = data.current_category ?? "No check-in yet";
    document.getElementById("dMood").textContent = data.today_mood !== null && data.today_mood !== undefined
      ? moodEmoji(data.today_mood) : "–";

    if (data.recommendation) {
      document.getElementById("dRecommendation").innerHTML =
        `${data.recommendation.primary.emoji} <strong>${data.recommendation.primary.label}</strong><br>` +
        `<span style="color:var(--ink-soft); font-size:0.85rem;">${data.recommendation.message}</span>`;
    }

    document.getElementById("dPoints").textContent = data.total_points ?? 0;
    document.getElementById("dStreak").textContent = `${data.current_streak ?? 0} 🔥`;
    document.getElementById("dLongestStreak").textContent = data.longest_streak ?? 0;
    document.getElementById("dActivitiesCount").textContent = data.activities_completed ?? 0;
    document.getElementById("dFavorite").textContent = data.favorite_activity
      ? capitalize(data.favorite_activity) : "Not yet set";

    renderTrend(data.trend || []);
    renderBadges(data.all_badges || {}, data.badges || []);
  } catch (e) {
    StressLess.toast("Couldn't load your dashboard right now.");
  }
})();

function moodEmoji(val) {
  if (val <= 2) return "😄";
  if (val <= 4) return "🙂";
  if (val <= 6) return "😐";
  if (val <= 8) return "😕";
  return "😩";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderTrend(trend) {
  const el = document.getElementById("dTrend");
  if (!trend.length) {
    el.innerHTML = `<p class="question-sub">Complete a few check-ins to see your trend here.</p>`;
    return;
  }
  el.innerHTML = trend.map(t => {
    const height = Math.max(6, (t.score / 100) * 100);
    return `<div class="trend-bar" style="height:${height}%;" title="${t.score}"></div>`;
  }).join("");
}

function renderBadges(allBadges, earnedList) {
  const earnedCodes = new Set(earnedList.map(b => b.badge_code));
  const el = document.getElementById("dBadges");
  el.innerHTML = Object.entries(allBadges).map(([code, b]) => {
    const earned = earnedCodes.has(code);
    return `<span class="badge-pill ${earned ? "earned" : ""}">${b.emoji} ${b.label}</span>`;
  }).join("");
}
