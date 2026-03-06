const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../database/nullbot.sqlite");
const BACKUP_DIR = path.join(__dirname, "../backups");
const MAX_BACKUPS = 7; // Keep last 7 days
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a timestamped backup of the SQLite database
 */
function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.warn("⚠️ Backup skipped: database file not found.");
      return null;
    }

    // Create timestamped filename
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const backupName = `nullbot_${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`💾 Database backup created: ${backupName}`);

    // Rotate old backups (keep only MAX_BACKUPS)
    rotateBackups();

    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    return null;
  }
}

/**
 * Delete old backups, keeping only the most recent MAX_BACKUPS
 */
function rotateBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("nullbot_") && f.endsWith(".sqlite"))
      .sort()
      .reverse(); // Newest first

    // Delete old backups beyond the limit
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`🗑️ Old backup deleted: ${file}`);
      }
    }
  } catch (error) {
    console.error("⚠️ Backup rotation error:", error.message);
  }
}

/**
 * Start the automatic backup scheduler
 * Runs once immediately, then every 24 hours
 */
function startBackupScheduler() {
  // Create initial backup on startup
  createBackup();

  // Schedule daily backups
  const interval = setInterval(createBackup, BACKUP_INTERVAL);
  console.log("🔄 Backup scheduler started (every 24 hours).");
  return interval;
}

module.exports = { createBackup, startBackupScheduler };
