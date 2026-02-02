const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "sentinel.sqlite");
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
    user = { user_id: userId, xp: 0, level: 1, last_message_date: 0 };
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
 */
function setGuildConfig(guildId, key, value) {
  const validKeys = ["welcome_channel", "log_channel", "level_up_channel"];
  if (!validKeys.includes(key)) {
    throw new Error(`Invalid config key: ${key}`);
  }

  // Upsert: insert or update
  const existing = getGuildConfig(guildId);
  if (existing) {
    const stmt = db.prepare(
      `UPDATE guild_config SET ${key} = ? WHERE guild_id = ?`,
    );
    stmt.run(value, guildId);
  } else {
    const stmt = db.prepare(
      `INSERT INTO guild_config (guild_id, ${key}) VALUES (?, ?)`,
    );
    stmt.run(guildId, value);
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
        level_up_channel TEXT
      );
    `);
    createGuildConfigTable.run();

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
};
