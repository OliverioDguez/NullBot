/**
 * NullBot Dashboard — Client-Side JavaScript
 * Vanilla JS, no frameworks. Uses fetch API for all data.
 */

let currentGuildId = null;
let statusChartInstance = null;
let xpChartInstance = null;

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
    .map((g) => `<option value="${g.id}">${g.name}</option>`)
    .join("");

  // Auto-select first guild
  currentGuildId = guilds[0].id;
  loadPage("overview");

  selector.addEventListener("change", (e) => {
    currentGuildId = e.target.value;
    const activePage =
      document.querySelector(".nav-item.active")?.dataset.page || "overview";
    loadPage(activePage);
  });
}

// ---- Navigation ---- //
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // FIX: Ensure we only get the dataset.page from the actual anchor tag or its closest anchor tag
      const anchor = e.target.closest('.nav-item');
      if (!anchor) return;
      const page = anchor.dataset.page;

      // Update active states
      document
        .querySelectorAll(".nav-item")
        .forEach((l) => l.classList.remove("active"));
      anchor.classList.add("active");

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
    case "tools":
      loadTools();
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

  // Render Server Status Chart
  if (statusChartInstance) statusChartInstance.destroy();
  const ctxStatus = document.getElementById("statusChart").getContext("2d");
  statusChartInstance = new Chart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: ["Online", "Idle", "Do Not Disturb", "Offline"],
      datasets: [{
        data: [
          data.statuses.online || 0,
          data.statuses.idle || 0,
          data.statuses.dnd || 0,
          data.statuses.offline || 0
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#64748b"],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      cutout: "75%",
      plugins: {
        legend: { position: "bottom", labels: { color: "#f8fafc", padding: 20 } }
      }
    }
  });

  // Render Top XP Chart
  if (xpChartInstance) xpChartInstance.destroy();
  const ctxXp = document.getElementById("xpChart").getContext("2d");
  const topNames = data.topUsers.map(u => u.username);
  const topXp = data.topUsers.map(u => u.xp);

  xpChartInstance = new Chart(ctxXp, {
    type: "bar",
    data: {
      labels: topNames,
      datasets: [{
        label: "XP",
        data: topXp,
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 4,
        hoverBackgroundColor: "rgba(6, 182, 212, 0.8)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
        x: { ticks: { color: "#94a3b8" }, grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });

  const lb = document.getElementById("overview-leaderboard");
  if (data.topUsers.length === 0) {
    lb.innerHTML = '<div class="empty-state">No XP data yet</div>';
    return;
  }

  lb.innerHTML = data.topUsers
    .map(
      (u, i) => `
    <div class="data-row leaderboard-row">
      <div class="rank rank-${i + 1}">${i + 1}</div>
      ${u.avatar ? `<img class="row-avatar" src="${u.avatar}" alt="">` : `<img class="row-avatar" src="https://cdn.discordapp.com/embed/avatars/0.png" alt="">`}
      <div class="row-details">
        <div class="row-title">${u.username}</div>
        <div class="row-subtitle">Level ${u.level} · ${u.xp.toLocaleString()} XP</div>
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
      .map((c) => `<option value="${c.id}">#${c.name}</option>`)
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
      ${w}
      <span class="tag-remove" data-word="${w}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
      </span>
    </span>
  `,
    )
    .join("");

  // Attach delete handlers
  container.querySelectorAll(".tag-remove").forEach((btn) => {
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
    <div class="data-row autoreply-row">
      <div class="row-details flex-row">
        <span class="row-title" style="color: var(--accent-blurple);">"${trigger}"</span>
        <span class="row-subtitle" style="margin-top:0;">→ ${response}</span>
      </div>
      <button class="btn btn-danger btn-sm remove-tag" style="padding: 0.3rem 0.6rem;" data-trigger="${trigger}">Delete</button>
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
      <div class="data-row warning-row">
        ${w.avatar ? `<img class="row-avatar" src="${w.avatar}" alt="">` : `<img class="row-avatar" src="https://cdn.discordapp.com/embed/avatars/0.png" alt="">`}
        <div class="row-details">
          <div class="row-title">${w.username} <span style="font-weight:400; opacity:0.7;">— ${w.reason || "No reason"}</span></div>
          <div class="row-subtitle">${date} · By <@${w.moderator_id}></div>
        </div>
        <button class="btn btn-danger delete-btn" data-id="${w.id}">Delete</button>
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
    <div class="data-row leaderboard-row">
      <div class="rank rank-${u.rank}">${u.rank}</div>
      ${u.avatar ? `<img class="row-avatar" src="${u.avatar}" alt="">` : `<img class="row-avatar" src="https://cdn.discordapp.com/embed/avatars/0.png" alt="">`}
      <div class="row-details">
        <div class="row-title">${u.username}</div>
        <div class="row-subtitle">Level ${u.level} · ${u.xp.toLocaleString()} XP</div>
      </div>
      <div class="xp-bar-container">
        <div class="xp-bar-fill" style="width: ${Math.min(100, (u.xp / (users[0]?.xp || 1)) * 100)}%"></div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ---- Tools / Generators ---- //
let currentRoles = [];
let buttonConfig = []; // Array of { label, style, roleId }

async function loadTools() {
  const res = await fetch(`/api/guild/${currentGuildId}/config`);
  const config = await res.json();
  
  currentRoles = config.roles || [];
  
  // Populate channels
  const channelSelect = document.getElementById("rr-channel");
  channelSelect.innerHTML = config.channels
    .map((c) => `<option value="${c.id}">#${c.name}</option>`)
    .join("");

  // Clear existing builder data when loading the page
  buttonConfig = [];
  renderRrButtons();
}

function renderRrButtons() {
  const container = document.getElementById("rr-buttons-container");
  
  if (buttonConfig.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:1rem;">No buttons added yet. Click "+ Add New Button" below.</div>';
    return;
  }

  container.innerHTML = buttonConfig.map((btn, index) => {
    // Role options
    const roleOptions = currentRoles.map(r => 
      `<option value="${r.id}" ${btn.roleId === r.id ? 'selected' : ''}>${r.name}</option>`
    ).join("");

    return `
      <div style="display:flex; gap:1rem; align-items:flex-end; background:rgba(0,0,0,0.2); padding:1rem; border-radius:8px;">
        <div style="flex:1">
          <label>Button Label</label>
          <input type="text" class="btn-label-input" data-index="${index}" value="${btn.label}" style="margin-bottom:0;" />
        </div>
        <div>
          <label>Style</label>
          <select class="btn-style-input" data-index="${index}" style="margin-bottom:0; width:120px;">
            <option value="blue" ${btn.style === 'blue' ? 'selected' : ''}>Blue</option>
            <option value="green" ${btn.style === 'green' ? 'selected' : ''}>Green</option>
            <option value="red" ${btn.style === 'red' ? 'selected' : ''}>Red</option>
            <option value="gray" ${btn.style === 'gray' ? 'selected' : ''}>Gray</option>
          </select>
        </div>
        <div style="flex:1">
          <label>Assigns Role</label>
          <select class="btn-role-input" data-index="${index}" style="margin-bottom:0;">
            <option value="">-- Select Role --</option>
            ${roleOptions}
          </select>
        </div>
        <button class="btn btn-danger remove-rr-btn" data-index="${index}" style="height:44px; margin-bottom:0;">✕</button>
      </div>
    `;
  }).join("");

  // Attach dynamic event listeners for fields and remove buttons
  container.querySelectorAll(".btn-label-input").forEach(el => 
    el.addEventListener("change", (e) => buttonConfig[e.target.dataset.index].label = e.target.value)
  );
  container.querySelectorAll(".btn-style-input").forEach(el => 
    el.addEventListener("change", (e) => buttonConfig[e.target.dataset.index].style = e.target.value)
  );
  container.querySelectorAll(".btn-role-input").forEach(el => 
    el.addEventListener("change", (e) => buttonConfig[e.target.dataset.index].roleId = e.target.value)
  );
  container.querySelectorAll(".remove-rr-btn").forEach(el => 
    el.addEventListener("click", (e) => {
      buttonConfig.splice(e.target.dataset.index, 1);
      renderRrButtons();
    })
  );
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

  // Add RR Button
  document.getElementById("add-rr-btn").addEventListener("click", () => {
    if (buttonConfig.length >= 5) {
      return showToast("Discord limit: Max 5 buttons per message", "error");
    }
    buttonConfig.push({ label: "New Button", style: "blue", roleId: "" });
    renderRrButtons();
  });

  // Submit RR
  document.getElementById("submit-rr").addEventListener("click", async () => {
    const channelId = document.getElementById("rr-channel").value;
    const title = document.getElementById("rr-title").value.trim();
    const description = document.getElementById("rr-description").value.trim();
    const color = document.getElementById("rr-color").value.trim();

    if (!channelId || !title) return showToast("Channel and Title are required", "error");
    if (buttonConfig.length === 0) return showToast("Add at least one action button", "error");
    const missingRoles = buttonConfig.some(b => !b.roleId);
    if (missingRoles) return showToast("Every button must have an assigned role", "error");

    const reqData = { channelId, title, description, color, buttons: buttonConfig };

    const res = await fetch(`/api/guild/${currentGuildId}/reaction-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData)
    });

    const body = await res.json();
    if (res.ok && body.success) {
      showToast("Reaction Role message published! 🚀", "success");
      // reset
      document.getElementById("rr-title").value = "Role Assignment";
      document.getElementById("rr-description").value = "";
      buttonConfig = [];
      renderRrButtons();
    } else {
      showToast(body.error || "Failed to publish message", "error");
    }
  });
}
