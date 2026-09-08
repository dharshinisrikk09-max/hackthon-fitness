/* api.js
   Shared helpers used across every page: anonymous user id, fetch wrapper,
   toast notifications, and small localStorage helpers so state (like the
   current stress score) can flow between pages without a server session. */

const StressLess = (() => {
  const USER_KEY = "stressless_user_id";

  function getUserId() {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : "u-" + Math.random().toString(36).slice(2);
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  }

  async function post(url, body = {}) {
    body.user_id = getUserId();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request to ${url} failed: ${text}`);
    }
    return res.json();
  }

  async function get(url) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}user_id=${encodeURIComponent(getUserId())}`);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
  }

  function toast(message, ms = 2600) {
    let el = document.querySelector(".sl-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "sl-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), ms);
  }

  function setState(key, value) {
    sessionStorage.setItem("sl_" + key, JSON.stringify(value));
  }
  function getState(key, fallback = null) {
    const raw = sessionStorage.getItem("sl_" + key);
    return raw ? JSON.parse(raw) : fallback;
  }

  return { getUserId, post, get, toast, setState, getState };
})();
