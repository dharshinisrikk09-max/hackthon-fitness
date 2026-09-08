/* journal.js — prompt selection, saving, and history rendering */

(() => {
  let selectedPrompt = "Free write";

  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".prompt-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedPrompt = chip.dataset.prompt;
      const textarea = document.getElementById("journalInput");
      if (selectedPrompt !== "Free write" && !textarea.value) {
        textarea.placeholder = selectedPrompt + " ...";
      }
    });
  });

  document.getElementById("saveEntryBtn").addEventListener("click", async () => {
    const textarea = document.getElementById("journalInput");
    const content = textarea.value.trim();
    if (!content) {
      StressLess.toast("Write a little something first 🙂");
      return;
    }
    try {
      const res = await StressLess.post("/api/journal", { prompt: selectedPrompt, content });
      if (res.ok) {
        StressLess.toast("Entry saved 💾");
        textarea.value = "";
        if (res.new_badge) {
          StressLess.toast(`New badge: ${res.new_badge.emoji} ${res.new_badge.label}!`, 3400);
        }
        loadEntries();
      }
    } catch (e) {
      StressLess.toast("Couldn't save right now — please try again.");
    }
  });

  async function loadEntries() {
    const list = document.getElementById("entryList");
    try {
      const res = await StressLess.get("/api/journal");
      if (!res.entries || res.entries.length === 0) {
        list.innerHTML = `<p class="question-sub">No entries yet — your first one is a click away 🌱</p>`;
        return;
      }
      list.innerHTML = res.entries.map(e => `
        <div class="journal-entry">
          <div class="meta">${e.prompt} · ${new Date(e.created_at + "Z").toLocaleString()}</div>
          <div>${escapeHtml(e.content)}</div>
        </div>
      `).join("");
    } catch (e) {
      list.innerHTML = `<p class="question-sub">Couldn't load past entries.</p>`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  loadEntries();
})();
