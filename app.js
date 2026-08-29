(() => {
  const STORAGE_KEY = "what100.goals.v1";
  const RESTORE_KEY = "what100.restore.v2026-08-29";
  const app = document.getElementById("app");

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function addDays(isoDate, offset) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  function markedDays(fromIso, toIso) {
    const days = {};
    let cursor = fromIso;
    while (cursor <= toIso) {
      days[cursor] = true;
      cursor = addDays(cursor, 1);
    }
    return days;
  }

  function seedGoals() {
    const startedOn = "2026-08-13";
    const through = "2026-08-29";
    const days = markedDays(startedOn, through);
    const titles = ["6 min exercise", "walk 1hr", "workout"];

    return titles.map((title) => ({
      id: uid(),
      title,
      startedOn,
      days: { ...days },
    }));
  }

  function loadGoals() {
    try {
      if (localStorage.getItem(RESTORE_KEY) !== "1") {
        const restored = seedGoals();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        localStorage.setItem(RESTORE_KEY, "1");
        return restored;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveGoals(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }

  function doneCount(goal) {
    return Object.values(goal.days || {}).filter(Boolean).length;
  }

  // Misses only "lock in" after an extra day, so you can backfill yesterday.
  function hasTwoConsecutiveMisses(goal) {
    const yesterday = addDays(todayKey(), -1);
    let missStreak = 0;

    for (let i = 0; i < 100; i += 1) {
      const date = addDays(goal.startedOn, i);
      if (date >= yesterday) break;

      if (goal.days?.[date]) {
        missStreak = 0;
      } else {
        missStreak += 1;
        if (missStreak >= 2) return true;
      }
    }

    return false;
  }

  function resetGoal(goal) {
    goal.startedOn = todayKey();
    goal.days = {};
  }

  function applyMissedDayResets(goals) {
    const resetTitles = [];
    let changed = false;

    for (const goal of goals) {
      if (!hasTwoConsecutiveMisses(goal)) continue;
      resetGoal(goal);
      resetTitles.push(goal.title);
      changed = true;
    }

    if (changed) saveGoals(goals);
    return resetTitles;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function resetNoticeHtml(resetTitles) {
    if (!resetTitles.length) return "";
    const label =
      resetTitles.length === 1
        ? `"${escapeHtml(resetTitles[0])}" reset — missed 2 days.`
        : `${resetTitles.length} goals reset — missed 2 days.`;
    return `<p class="notice" role="status">${label}</p>`;
  }

  function getRoute() {
    const hash = location.hash.replace(/^#/, "");
    if (!hash || hash === "/") return { name: "home" };
    const match = hash.match(/^\/goal\/([^/]+)$/);
    if (match) return { name: "goal", id: decodeURIComponent(match[1]) };
    return { name: "home" };
  }

  function goHome() {
    location.hash = "#/";
  }

  function goGoal(id) {
    location.hash = `#/goal/${encodeURIComponent(id)}`;
  }

  function renderHome(goals, resetTitles = []) {
    const list =
      goals.length === 0
        ? `<div class="empty">No goals yet.<br />Add one below to open its 100-day calendar.</div>`
        : `<div class="goal-list">
            ${goals
              .map((goal) => {
                const count = doneCount(goal);
                const pct = Math.round((count / 100) * 100);
                return `
                  <button class="goal-card" type="button" data-open="${escapeHtml(goal.id)}">
                    <h2>${escapeHtml(goal.title)}</h2>
                    <div class="bar" aria-hidden="true"><span style="--progress:${pct}%"></span></div>
                    <div class="meta">
                      <span>${count} / 100 days</span>
                      <span>opened ${escapeHtml(goal.startedOn)}</span>
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>`;

    app.innerHTML = `
      <section class="screen">
        <h1 class="brand">what<span>100</span></h1>
        <p class="lede">One goal. One hundred days. Miss 2 days (without backfill) and it resets.</p>
        ${resetNoticeHtml(resetTitles)}
        <form class="composer" id="new-goal-form">
          <input
            id="goal-title"
            name="title"
            maxlength="80"
            autocomplete="off"
            placeholder="New goal — e.g. write every day"
            required
          />
          <button class="btn btn-primary" type="submit">Add goal</button>
        </form>
        ${list}
      </section>
    `;

    const form = document.getElementById("new-goal-form");
    const input = document.getElementById("goal-title");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = input.value.trim();
      if (!title) return;

      const goalsNow = loadGoals();
      const goal = {
        id: uid(),
        title,
        startedOn: todayKey(),
        days: {},
      };
      goalsNow.unshift(goal);
      saveGoals(goalsNow);
      goGoal(goal.id);
    });

    app.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => {
        goGoal(button.getAttribute("data-open"));
      });
    });

    input.focus();
  }

  function renderGoal(goals, id, resetTitles = []) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) {
      goHome();
      return;
    }

    const count = doneCount(goal);
    const today = todayKey();
    const thisReset = resetTitles.includes(goal.title);

    const cells = Array.from({ length: 100 }, (_, index) => {
      const date = addDays(goal.startedOn, index);
      const done = Boolean(goal.days?.[date]);
      const isToday = date === today;
      const classes = ["day", done ? "done" : "", isToday ? "today" : ""]
        .filter(Boolean)
        .join(" ");
      return `
        <button
          class="${classes}"
          type="button"
          data-date="${date}"
          aria-pressed="${done}"
          title="${date}"
        >${index + 1}</button>
      `;
    }).join("");

    app.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <button class="btn btn-ghost" type="button" id="back-btn">← Goals</button>
          <button class="btn btn-danger" type="button" id="delete-btn">Delete</button>
        </div>
        <h1 class="detail-title">${escapeHtml(goal.title)}</h1>
        <p class="detail-sub">${count} of 100 days marked · started ${escapeHtml(goal.startedOn)}</p>
        ${
          thisReset
            ? `<p class="notice" role="status">Reset — missed 2 days. Calendar starts over today.</p>`
            : ""
        }
        <div class="calendar" id="calendar">${cells}</div>
        <div class="footer-actions">
          <p class="hint">Tap a day to toggle. Miss 2 days in a row (you can still fill in yesterday) and this goal resets.</p>
        </div>
      </section>
    `;

    document.getElementById("back-btn").addEventListener("click", goHome);

    document.getElementById("delete-btn").addEventListener("click", () => {
      const next = loadGoals().filter((item) => item.id !== goal.id);
      saveGoals(next);
      goHome();
    });

    document.getElementById("calendar").addEventListener("click", (event) => {
      const button = event.target.closest("[data-date]");
      if (!button) return;

      const date = button.getAttribute("data-date");
      const nextGoals = loadGoals();
      const current = nextGoals.find((item) => item.id === goal.id);
      if (!current) return;

      current.days = current.days || {};
      current.days[date] = !current.days[date];
      if (!current.days[date]) delete current.days[date];

      let toggledResets = [];
      if (hasTwoConsecutiveMisses(current)) {
        resetGoal(current);
        toggledResets = [current.title];
      }

      saveGoals(nextGoals);
      renderGoal(nextGoals, goal.id, toggledResets);
    });
  }

  function render() {
    const goals = loadGoals();
    const resetTitles = applyMissedDayResets(goals);
    const route = getRoute();
    if (route.name === "goal") {
      renderGoal(goals, route.id, resetTitles);
      return;
    }
    renderHome(goals, resetTitles);
  }

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.hash = "#/";
  } else {
    render();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
})();
