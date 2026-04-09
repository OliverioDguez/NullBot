const express = require("express");
const router = express.Router();
const {
  requireAuth,
  requireGuildAdmin,
  requireCsrf,
} = require("../middleware/auth");
const {
  getGuildConfig,
  setGuildConfig,
  getLeaderboard,
  getWarnings,
  getWarningCount,
  removeWarning,
  getBannedWords,
  addBannedWord,
  removeBannedWord,
  getAutoReplies,
  addAutoReply,
  removeAutoReply,
} = require("../../database/db");

// Apply CSRF protection to all mutating API requests
router.use(requireCsrf);

/**
 * GET /api/guilds — List guilds where user is admin AND bot is present
 */
router.get("/guilds", requireAuth, (req, res) => {
  const client = req.app.get("discordClient");
  const userGuilds = req.session.guilds || [];

  // Filter: user has Manage Server (0x20) or Administrator (0x8)
  const adminGuilds = userGuilds
    .filter((g) => {
      const perms = BigInt(g.permissions);
      return (perms & 0x20n) === 0x20n || (perms & 0x8n) === 0x8n;
    })
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      botPresent: client.guilds.cache.has(g.id),
    }))
    .filter((g) => g.botPresent);

  res.json(adminGuilds);
});

/**
 * GET /api/guild/:guildId/overview — Server stats
 */
router.get(
  "/guild/:guildId/overview",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const client = req.app.get("discordClient");
    const guild = client.guilds.cache.get(req.params.guildId);

    if (!guild) {
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    const leaderboard = getLeaderboard(guild.id, 5);
    const config = getGuildConfig(guild.id);

    const statuses = { online: 0, idle: 0, dnd: 0, offline: 0 };
    guild.members.cache.forEach((m) => {
      const s = m.presence ? m.presence.status : "offline";
      if (statuses.hasOwnProperty(s)) {
        statuses[s]++;
      } else {
        statuses.offline++;
      }
    });

    res.json({
      name: guild.name,
      icon: guild.iconURL({ size: 128 }),
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      statuses,
      topUsers: leaderboard.map((u) => {
        const member = guild.members.cache.get(u.user_id);
        return {
          userId: u.user_id,
          username: member ? member.user.username : "Unknown",
          avatar: member ? member.user.displayAvatarURL({ size: 32 }) : null,
          xp: u.xp,
          level: u.level,
        };
      }),
      hasConfig: !!config,
    });
  },
);

/**
 * GET /api/guild/:guildId/config — Get guild configuration
 */
router.get(
  "/guild/:guildId/config",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const client = req.app.get("discordClient");
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    const config = getGuildConfig(guild.id) || {};
    const bannedWords = getBannedWords(guild.id);
    const autoReplies = getAutoReplies(guild.id);

    // Get text channels for dropdowns
    const channels = guild.channels.cache
      .filter((c) => c.type === 0) // Text channels
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      welcomeChannel: config.welcome_channel || null,
      logChannel: config.log_channel || null,
      levelUpChannel: config.level_up_channel || null,
      bannedWords,
      autoReplies,
      channels,
    });
  },
);

/**
 * PUT /api/guild/:guildId/config — Update guild configuration
 */
router.put(
  "/guild/:guildId/config",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const guildId = req.params.guildId;
    const { key, value } = req.body;

    const validKeys = ["welcome_channel", "log_channel", "level_up_channel"];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid config key" });
    }

    try {
      setGuildConfig(guildId, key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/guild/:guildId/banned-words — Add a banned word
 */
router.post(
  "/guild/:guildId/banned-words",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: "Word is required" });

    const added = addBannedWord(req.params.guildId, word);
    res.json({
      success: added,
      message: added ? "Word added" : "Word already exists",
    });
  },
);

/**
 * DELETE /api/guild/:guildId/banned-words/:word — Remove a banned word
 */
router.delete(
  "/guild/:guildId/banned-words/:word",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const removed = removeBannedWord(req.params.guildId, req.params.word);
    res.json({ success: removed });
  },
);

/**
 * POST /api/guild/:guildId/auto-replies — Add an auto-reply
 */
router.post(
  "/guild/:guildId/auto-replies",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const { trigger, response } = req.body;
    if (!trigger || !response) {
      return res.status(400).json({ error: "Trigger and response required" });
    }
    addAutoReply(req.params.guildId, trigger, response);
    res.json({ success: true });
  },
);

/**
 * DELETE /api/guild/:guildId/auto-replies/:trigger — Remove an auto-reply
 */
router.delete(
  "/guild/:guildId/auto-replies/:trigger",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const removed = removeAutoReply(
      req.params.guildId,
      decodeURIComponent(req.params.trigger),
    );
    res.json({ success: removed });
  },
);

/**
 * GET /api/guild/:guildId/warnings — Get all warnings
 */
router.get(
  "/guild/:guildId/warnings",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const client = req.app.get("discordClient");
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    // Get all unique warned users
    const db = require("../../database/db").db;
    const stmt = db.prepare(
      "SELECT DISTINCT user_id FROM warnings WHERE guild_id = ?",
    );
    const users = stmt.all(req.params.guildId);

    const allWarnings = [];
    for (const { user_id } of users) {
      const warnings = getWarnings(req.params.guildId, user_id);
      const member = guild.members.cache.get(user_id);
      for (const warn of warnings) {
        allWarnings.push({
          ...warn,
          username: member ? member.user.username : `User ${user_id}`,
          avatar: member ? member.user.displayAvatarURL({ size: 32 }) : null,
        });
      }
    }

    // Sort by timestamp descending
    allWarnings.sort((a, b) => b.timestamp - a.timestamp);
    res.json(allWarnings);
  },
);

/**
 * DELETE /api/guild/:guildId/warnings/:warnId — Delete a warning
 */
router.delete(
  "/guild/:guildId/warnings/:warnId",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const removed = removeWarning(
      req.params.guildId,
      parseInt(req.params.warnId),
    );
    res.json({ success: removed });
  },
);

/**
 * GET /api/guild/:guildId/leaderboard — Get XP leaderboard
 */
router.get(
  "/guild/:guildId/leaderboard",
  requireAuth,
  requireGuildAdmin,
  (req, res) => {
    const client = req.app.get("discordClient");
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = getLeaderboard(guild.id, limit);

    const data = leaderboard.map((u, i) => {
      const member = guild.members.cache.get(u.user_id);
      return {
        rank: i + 1,
        userId: u.user_id,
        username: member ? member.user.username : `User ${u.user_id}`,
        avatar: member ? member.user.displayAvatarURL({ size: 32 }) : null,
        xp: u.xp,
        level: u.level,
      };
    });

    res.json(data);
  },
);

module.exports = router;
