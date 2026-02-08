const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "nullbot.sqlite");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// --- XP/Level Configuration ---
const XP_PER_MESSAGE = 15; // Base XP per message
const XP_VARIANCE = 10; // Random variance (+/- this amount)
const XP_COOLDOWN = 60000; // 60 seconds between XP gains (prevents spam)

/**
 * Calculate level from total XP
 * Formula: level = floor(0.1 * sqrt(xp))
 * This means: Level 10 = 10,000 XP, Level 20 = 40,000 XP, etc.
 */
function calculateLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp)) + 1;
}

/**
 * Calculate XP required for a specific level
 */
function xpForLevel(level) {
  return Math.pow((level - 1) / 0.1, 2);
}

/**
 * Get user data from database
 */
function getUser(userId) {
  const stmt = db.prepare("SELECT * FROM user_levels WHERE user_id = ?");
  return stmt.get(userId);
}

/**
 * Add XP to a user and return level up info if applicable
 */
function addXP(userId) {
  const now = Date.now();
  let user = getUser(userId);

  // Create user if doesn't exist
  if (!user) {
    const insert = db.prepare(
      "INSERT INTO user_levels (user_id, xp, level, last_message_date) VALUES (?, 0, 1, 0)",
    );
    insert.run(userId);
    user = { user_id: userId, xp: 0, level: 1, last_message_date: null };
  }

  // Check cooldown
  if (now - user.last_message_date < XP_COOLDOWN) {
    return null; // Still on cooldown
  }

  // Calculate XP to add (with variance)
  const xpToAdd =
    XP_PER_MESSAGE + Math.floor(Math.random() * XP_VARIANCE * 2) - XP_VARIANCE;
  const newXP = user.xp + Math.max(xpToAdd, 5); // Minimum 5 XP
  const oldLevel = user.level;
  const newLevel = calculateLevel(newXP);

  // Update database
  const update = db.prepare(
    "UPDATE user_levels SET xp = ?, level = ?, last_message_date = ? WHERE user_id = ?",
  );
  update.run(newXP, newLevel, now, userId);

  // Return level up info if leveled up
  if (newLevel > oldLevel) {
    return { leveledUp: true, oldLevel, newLevel, xp: newXP };
  }

  return { leveledUp: false, xp: newXP, level: newLevel };
}

/**
 * Get top users for leaderboard
 */
function getLeaderboard(limit = 10) {
  const stmt = db.prepare("SELECT * FROM user_levels ORDER BY xp DESC LIMIT ?");
  return stmt.all(limit);
}

/**
 * Get user rank (position on leaderboard)
 */
function getUserRank(userId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank 
    FROM user_levels 
    WHERE xp > (SELECT xp FROM user_levels WHERE user_id = ?)
  `);
  const result = stmt.get(userId);
  return result ? result.rank : null;
}

/**
 * Get guild configuration
 */
function getGuildConfig(guildId) {
  const stmt = db.prepare("SELECT * FROM guild_config WHERE guild_id = ?");
  return stmt.get(guildId) || null;
}

/**
 * Set a guild configuration value
 * Uses specific prepared statements to avoid SQL injection
 */
function setGuildConfig(guildId, key, value) {
  const validKeys = ["welcome_channel", "log_channel", "level_up_channel"];
  if (!validKeys.includes(key)) {
    throw new Error(`Invalid config key: ${key}`);
  }

  // Upsert: insert or update using specific prepared statements (no string interpolation)
  const existing = getGuildConfig(guildId);

  // Define specific statements for each column to avoid SQL interpolation
  const updateStatements = {
    welcome_channel: db.prepare(
      "UPDATE guild_config SET welcome_channel = ? WHERE guild_id = ?",
    ),
    log_channel: db.prepare(
      "UPDATE guild_config SET log_channel = ? WHERE guild_id = ?",
    ),
    level_up_channel: db.prepare(
      "UPDATE guild_config SET level_up_channel = ? WHERE guild_id = ?",
    ),
  };

  const insertStatements = {
    welcome_channel: db.prepare(
      "INSERT INTO guild_config (guild_id, welcome_channel) VALUES (?, ?)",
    ),
    log_channel: db.prepare(
      "INSERT INTO guild_config (guild_id, log_channel) VALUES (?, ?)",
    ),
    level_up_channel: db.prepare(
      "INSERT INTO guild_config (guild_id, level_up_channel) VALUES (?, ?)",
    ),
  };

  if (existing) {
    updateStatements[key].run(value, guildId);
  } else {
    insertStatements[key].run(guildId, value);
  }
}

module.exports = {
  db,
  initDB: () => {
    const createUsersTable = db.prepare(`
      CREATE TABLE IF NOT EXISTS user_levels (
        user_id TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_message_date INTEGER
      );
    `);
    createUsersTable.run();

    // Guild config table for per-server settings
    const createGuildConfigTable = db.prepare(`
      CREATE TABLE IF NOT EXISTS guild_config (
        guild_id TEXT PRIMARY KEY,
        welcome_channel TEXT,
        log_channel TEXT,
        level_up_channel TEXT,
        banned_words TEXT DEFAULT '[]',
        auto_replies TEXT DEFAULT '{}'
      );
    `);
    createGuildConfigTable.run();

    // Warnings table for moderation
    const createWarningsTable = db.prepare(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    createWarningsTable.run();

    // Add banned_words column if it doesn't exist (for existing databases)
    try {
      db.prepare(
        "ALTER TABLE guild_config ADD COLUMN banned_words TEXT DEFAULT '[]'",
      ).run();
    } catch (e) {
      // Column already exists, ignore
    }

    // Add auto_replies column if it doesn't exist
    try {
      db.prepare(
        "ALTER TABLE guild_config ADD COLUMN auto_replies TEXT DEFAULT '{}'",
      ).run();
    } catch (e) {
      // Column already exists, ignore
    }

    console.log("📊 Database tables initialized.");
  },
  // XP System exports
  getUser,
  addXP,
  getLeaderboard,
  getUserRank,
  calculateLevel,
  xpForLevel,
  XP_PER_MESSAGE,
  // Guild config exports
  getGuildConfig,
  setGuildConfig,
  // Banned words exports
  getBannedWords: (guildId) => {
    const config = getGuildConfig(guildId);
    if (!config || !config.banned_words) return [];
    try {
      return JSON.parse(config.banned_words);
    } catch {
      return [];
    }
  },
  addBannedWord: (guildId, word) => {
    const config = getGuildConfig(guildId);
    let words = [];
    if (config && config.banned_words) {
      try {
        words = JSON.parse(config.banned_words);
      } catch {
        words = [];
      }
    }
    const normalizedWord = word.toLowerCase().trim();
    if (words.includes(normalizedWord)) return false;
    words.push(normalizedWord);

    // Ensure guild config exists
    if (!config) {
      db.prepare(
        "INSERT INTO guild_config (guild_id, banned_words) VALUES (?, ?)",
      ).run(guildId, JSON.stringify(words));
    } else {
      db.prepare(
        "UPDATE guild_config SET banned_words = ? WHERE guild_id = ?",
      ).run(JSON.stringify(words), guildId);
    }
    return true;
  },
  removeBannedWord: (guildId, word) => {
    const config = getGuildConfig(guildId);
    if (!config || !config.banned_words) return false;
    let words = [];
    try {
      words = JSON.parse(config.banned_words);
    } catch {
      return false;
    }
    const normalizedWord = word.toLowerCase().trim();
    const index = words.indexOf(normalizedWord);
    if (index === -1) return false;
    words.splice(index, 1);
    db.prepare(
      "UPDATE guild_config SET banned_words = ? WHERE guild_id = ?",
    ).run(JSON.stringify(words), guildId);
    return true;
  },
  // Warning system exports
  addWarning: (guildId, userId, moderatorId, reason) => {
    const stmt = db.prepare(
      "INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)",
    );
    const result = stmt.run(guildId, userId, moderatorId, reason, Date.now());
    return result.lastInsertRowid;
  },
  getWarnings: (guildId, userId) => {
    const stmt = db.prepare(
      "SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC",
    );
    return stmt.all(guildId, userId);
  },
  getWarningCount: (guildId, userId) => {
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?",
    );
    const result = stmt.get(guildId, userId);
    return result ? result.count : 0;
  },
  clearWarnings: (guildId, userId) => {
    const stmt = db.prepare(
      "DELETE FROM warnings WHERE guild_id = ? AND user_id = ?",
    );
    const result = stmt.run(guildId, userId);
    return result.changes;
  },
  removeWarning: (warningId) => {
    const stmt = db.prepare("DELETE FROM warnings WHERE id = ?");
    const result = stmt.run(warningId);
    return result.changes > 0;
  },
  // Auto-reply system exports
  getAutoReplies: (guildId) => {
    const config = getGuildConfig(guildId);
    if (!config || !config.auto_replies) return {};
    try {
      return JSON.parse(config.auto_replies);
    } catch {
      return {};
    }
  },
  addAutoReply: (guildId, trigger, response) => {
    const config = getGuildConfig(guildId);
    let replies = {};
    if (config && config.auto_replies) {
      try {
        replies = JSON.parse(config.auto_replies);
      } catch {
        replies = {};
      }
    }
    const normalizedTrigger = trigger.toLowerCase().trim();
    replies[normalizedTrigger] = response;

    // Ensure guild config exists
    if (!config) {
      db.prepare(
        "INSERT INTO guild_config (guild_id, auto_replies) VALUES (?, ?)",
      ).run(guildId, JSON.stringify(replies));
    } else {
      db.prepare(
        "UPDATE guild_config SET auto_replies = ? WHERE guild_id = ?",
      ).run(JSON.stringify(replies), guildId);
    }
    return true;
  },
  removeAutoReply: (guildId, trigger) => {
    const config = getGuildConfig(guildId);
    if (!config || !config.auto_replies) return false;
    let replies = {};
    try {
      replies = JSON.parse(config.auto_replies);
    } catch {
      return false;
    }
    const normalizedTrigger = trigger.toLowerCase().trim();
    if (!(normalizedTrigger in replies)) return false;
    delete replies[normalizedTrigger];
    db.prepare(
      "UPDATE guild_config SET auto_replies = ? WHERE guild_id = ?",
    ).run(JSON.stringify(replies), guildId);
    return true;
  },
};
