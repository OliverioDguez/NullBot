/**
 * Auth middleware — checks if user is logged in via Discord OAuth2
 */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

/**
 * Guild admin middleware — checks if user has MANAGE_GUILD permission
 * Must be used after requireAuth
 */
function requireGuildAdmin(req, res, next) {
  const guildId = req.params.guildId;
  const userGuilds = req.session.guilds || [];

  const guild = userGuilds.find((g) => g.id === guildId);
  if (!guild) {
    return res
      .status(403)
      .json({ error: "You do not have access to this server" });
  }

  // Check MANAGE_GUILD permission (bit 0x20n) or ADMINISTRATOR (0x8n)
  const hasPermission =
    (BigInt(guild.permissions) & 0x20n) === 0x20n ||
    (BigInt(guild.permissions) & 0x8n) === 0x8n;

  if (!hasPermission) {
    return res.status(403).json({ error: "You need Manage Server permission" });
  }

  next();
}

/**
 * CSRF middleware — ensures mutating requests come from the dashboard itself
 */
function requireCsrf(req, res, next) {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.get("Origin");
    const expectedOrigin = process.env.DASHBOARD_URL || "http://localhost:3000";
    if (origin && origin !== expectedOrigin) {
      return res.status(403).json({ error: "CSRF Validation Failed" });
    }
  }
  next();
}

module.exports = { requireAuth, requireGuildAdmin, requireCsrf };
