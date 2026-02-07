const { EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../database/db");

/**
 * Action colors for moderation log embeds
 */
const ACTION_COLORS = {
  ban: "#FF0000",
  kick: "#FFA500",
  timeout: "#FFFF00",
  clear: "#808080",
  warn: "#FF8C00",
  unban: "#00FF00",
};

/**
 * Action emojis for moderation log embeds
 */
const ACTION_EMOJIS = {
  ban: "🔨",
  kick: "👢",
  timeout: "⏰",
  clear: "🗑️",
  warn: "⚠️",
  unban: "✅",
};

/**
 * Send a moderation log to the configured log channel
 * @param {Guild} guild - The Discord guild
 * @param {Object} options - Log options
 * @param {string} options.action - The action type (ban, kick, timeout, clear)
 * @param {User} options.target - The target user (optional for clear)
 * @param {User} options.moderator - The moderator who performed the action
 * @param {string} options.reason - Reason for the action
 * @param {string} [options.extra] - Extra info (duration, message count, etc.)
 */
async function sendModLog(guild, { action, target, moderator, reason, extra }) {
  try {
    const config = getGuildConfig(guild.id);
    if (!config?.log_channel) return;

    const channel = guild.channels.cache.get(config.log_channel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(ACTION_COLORS[action] || "#5865F2")
      .setTitle(
        `${ACTION_EMOJIS[action] || "📋"} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      )
      .addFields({ name: "Moderator", value: `${moderator}`, inline: true })
      .setTimestamp();

    // Add target if present (not for clear)
    if (target) {
      embed.spliceFields(0, 0, {
        name: "User",
        value: `${target} (${target.id})`,
        inline: true,
      });
      embed.setThumbnail(target.displayAvatarURL({ size: 64 }));
    }

    // Add reason
    embed.addFields({ name: "Reason", value: reason || "No reason provided" });

    // Add extra info if present
    if (extra) {
      embed.addFields({ name: "Details", value: extra });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to send mod log:", error.message);
  }
}

module.exports = { sendModLog };
