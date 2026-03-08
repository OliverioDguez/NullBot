/**
 * NullBot Dashboard — Client-Side JavaScript
 * Vanilla JS, no frameworks. Uses fetch API for all data.
 */

let currentGuildId = null;

// ---- Security: HTML Escaping ---- //
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// ---- Toast Notifications ---- //
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---- Initialization ---- //
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadGuilds();
  setupNavigation();
  setupEventListeners();
});

// ---- Auth & User ---- //
async function loadUser() {
  try {
    const res = await fetch("/auth/me");
    if (!res.ok) {
      window.location.href = "/";
      return;
    }
    const data = await res.json();
    const userInfo = document.getElementById("user-info");
    const avatarUrl = data.user.avatar
      ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png?size=32`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    userInfo.innerHTML = `
      <img src="${avatarUrl}" alt="avatar">
      <span>${data.user.username}</span>
    `;
  } catch {
    window.location.href = "/";
  }
}

// ---- Guild Selection ---- //
async function loadGuilds() {
  const res = await fetch("/api/guilds");
  const guilds = await res.json();
  const selector = document.getElementById("guild-selector");

  if (guilds.length === 0) {
    selector.innerHTML = "<option>No servers found</option>";
    return;
  }

  selector.innerHTML = guilds
    .map(
      (g) =>
        `<option value="${escapeHtml(g.id)}">${escapeHtml(g.name)}</option>`,
    )
    .join("");

  // Auto-select first guild
  currentGuildId = guilds[0].id;
  loadPage("overview");

  selector.addEventListener("change", (e) => {
    currentGuildId = e.target.value;
    const activePage =
      document.querySelector(".nav-link.active")?.dataset.page || "overview";
    loadPage(activePage);
  });
}

// ---- Navigation ---- //
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;

      // Update active states
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      document.getElementById(`page-${page}`).classList.add("active");

      loadPage(page);
    });
  });
}

// ---- Page Loader ---- //
function loadPage(page) {
  if (!currentGuildId) return;
  switch (page) {
    case "overview":
      loadOverview();
      break;
    case "config":
      loadConfig();
      break;
    case "warnings":
      loadWarnings();
      break;
    case "leaderboard":
      loadLeaderboard();
      break;
  }
}

// ---- Overview ---- //
async function loadOverview() {
  const res = await fetch(`/api/guild/${currentGuildId}/overview`);
  const data = await res.json();

  document.getElementById("overview-stats").innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${data.memberCount}</div>
      <div class="stat-label">Members</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.channelCount}</div>
      <div class="stat-label">Channels</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.roleCount}</div>
      <div class="stat-label">Roles</div>
    </div>
  `;

  const lb = document.getElementById("overview-leaderboard");
  if (data.topUsers.length === 0) {
    lb.innerHTML = '<div class="empty-state">No XP data yet</div>';
    return;
  }

  lb.innerHTML = data.topUsers
    .map(
      (u, i) => `
    <div class="leaderboard-row">
      <div class="rank-badge ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}">${i + 1}</div>
      ${u.avatar ? `<img src="${u.avatar}" alt="">` : ""}
      <div class="user-details">
        <div class="username">${escapeHtml(u.username)}</div>
        <div class="meta">Level ${u.level} · ${u.xp.toLocaleString()} XP</div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ---- Configuration ---- //
async function loadConfig() {
  const res = await fetch(`/api/guild/${currentGuildId}/config`);
  const config = await res.json();

  // Populate channel dropdowns
  const channelOptions =
    '<option value="">None</option>' +
    config.channels
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}">#${escapeHtml(c.name)}</option>`,
      )
      .join("");

  ["cfg-welcome", "cfg-log", "cfg-levelup"].forEach((id) => {
    const select = document.getElementById(id);
    select.innerHTML = channelOptions;
  });

  // Set current values
  if (config.welcomeChannel)
    document.getElementById("cfg-welcome").value = config.welcomeChannel;
  if (config.logChannel)
    document.getElementById("cfg-log").value = config.logChannel;
  if (config.levelUpChannel)
    document.getElementById("cfg-levelup").value = config.levelUpChannel;

  // Render banned words
  renderBannedWords(config.bannedWords);

  // Render auto-replies
  renderAutoReplies(config.autoReplies);
}

function renderBannedWords(words) {
  const container = document.getElementById("banned-words-list");
  if (words.length === 0) {
    container.innerHTML = '<div class="empty-state">No banned words</div>';
    return;
  }
  container.innerHTML = words
    .map(
      (w) => `
    <span class="tag">
      ${escapeHtml(w)}
      <span class="remove-tag" data-word="${escapeHtml(w)}">✕</span>
    </span>
  `,
    )
    .join("");

  // Attach delete handlers
  container.querySelectorAll(".remove-tag").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch(
        `/api/guild/${currentGuildId}/banned-words/${encodeURIComponent(btn.dataset.word)}`,
        {
          method: "DELETE",
        },
      );
      showToast("Word removed");
      loadConfig();
    });
  });
}

function renderAutoReplies(replies) {
  const container = document.getElementById("auto-replies-list");
  const entries = Object.entries(replies);
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No auto-replies</div>';
    return;
  }
  container.innerHTML = entries
    .map(
      ([trigger, response]) => `
    <div class="autoreply-row">
      <span class="autoreply-trigger">"${escapeHtml(trigger)}"</span>
      <span class="autoreply-response">→ ${escapeHtml(response)}</span>
      <span class="remove-tag" data-trigger="${escapeHtml(trigger)}">✕</span>
    </div>
  `,
    )
    .join("");

  container.querySelectorAll(".remove-tag").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch(
        `/api/guild/${currentGuildId}/auto-replies/${encodeURIComponent(btn.dataset.trigger)}`,
        {
          method: "DELETE",
        },
      );
      showToast("Auto-reply removed");
      loadConfig();
    });
  });
}

// ---- Warnings ---- //
async function loadWarnings() {
  const res = await fetch(`/api/guild/${currentGuildId}/warnings`);
  const warnings = await res.json();

  renderWarnings(warnings);

  // Search handler
  const search = document.getElementById("warning-search");
  search.oninput = () => {
    const q = search.value.toLowerCase();
    const filtered = warnings.filter((w) =>
      w.username.toLowerCase().includes(q),
    );
    renderWarnings(filtered);
  };
}

function renderWarnings(warnings) {
  const container = document.getElementById("warnings-list");
  if (warnings.length === 0) {
    container.innerHTML = '<div class="empty-state">No warnings found</div>';
    return;
  }

  container.innerHTML = warnings
    .map((w) => {
      const date = new Date(w.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `
      <div class="warning-row">
        ${w.avatar ? `<img src="${w.avatar}" alt="">` : ""}
        <div class="warning-info">
          <div class="warning-reason"><strong>${escapeHtml(w.username)}</strong> — ${escapeHtml(w.reason) || "No reason"}</div>
          <div class="warning-meta">${date} · By ${escapeHtml(w.moderator_id)}</div>
        </div>
        <button class="delete-btn" data-id="${w.id}">Delete</button>
      </div>
    `;
    })
    .join("");

  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch(`/api/guild/${currentGuildId}/warnings/${btn.dataset.id}`, {
        method: "DELETE",
      });
      showToast("Warning deleted");
      loadWarnings();
    });
  });
}

// ---- Leaderboard ---- //
async function loadLeaderboard() {
  const res = await fetch(`/api/guild/${currentGuildId}/leaderboard?limit=50`);
  const users = await res.json();

  const container = document.getElementById("leaderboard-table");
  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state">No XP data yet</div>';
    return;
  }

  container.innerHTML = users
    .map(
      (u) => `
    <div class="leaderboard-row">
      <div class="rank-badge ${u.rank === 1 ? "gold" : u.rank === 2 ? "silver" : u.rank === 3 ? "bronze" : ""}">${u.rank}</div>
      ${u.avatar ? `<img src="${u.avatar}" alt="">` : ""}
      <div class="user-details">
        <div class="username">${escapeHtml(u.username)}</div>
        <div class="meta">Level ${u.level} · ${u.xp.toLocaleString()} XP</div>
      </div>
      <div class="xp-bar">
        <div class="xp-bar-fill" style="width: ${Math.min(100, (u.xp / (users[0]?.xp || 1)) * 100)}%"></div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ---- Event Listeners ---- //
function setupEventListeners() {
  // Channel config changes
  ["cfg-welcome", "cfg-log", "cfg-levelup"].forEach((id) => {
    const keyMap = {
      "cfg-welcome": "welcome_channel",
      "cfg-log": "log_channel",
      "cfg-levelup": "level_up_channel",
    };
    document.getElementById(id).addEventListener("change", async (e) => {
      await fetch(`/api/guild/${currentGuildId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: keyMap[id],
          value: e.target.value || null,
        }),
      });
      showToast("Channel updated ✓");
    });
  });

  // Add banned word
  document
    .getElementById("add-banned-word")
    .addEventListener("click", async () => {
      const input = document.getElementById("banned-word-input");
      const word = input.value.trim();
      if (!word) return;

      await fetch(`/api/guild/${currentGuildId}/banned-words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      input.value = "";
      showToast(`"${word}" added to banned words`);
      loadConfig();
    });

  // Add auto-reply
  document
    .getElementById("add-autoreply")
    .addEventListener("click", async () => {
      const trigger = document.getElementById("autoreply-trigger");
      const response = document.getElementById("autoreply-response");
      if (!trigger.value.trim() || !response.value.trim()) return;

      await fetch(`/api/guild/${currentGuildId}/auto-replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: trigger.value.trim(),
          response: response.value.trim(),
        }),
      });
      trigger.value = "";
      response.value = "";
      showToast("Auto-reply added ✓");
      loadConfig();
    });
}
