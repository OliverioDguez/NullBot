const { EmbedBuilder, Events, AuditLogEvent } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    const guild = ban.guild;

    // Get log channel from config
    const config = getGuildConfig(guild.id);
    if (!config || !config.log_channel) return;

    const logChannel = guild.channels.cache.get(config.log_channel);
    if (!logChannel) return;

    // Try to get the moderator from audit logs
    let moderator = "Unknown";
    let reason = "No reason provided";

    try {
      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanRemove,
        limit: 1,
      });
      const unbanLog = auditLogs.entries.first();

      // Check if the log is for this user and recent (within 5 seconds)
      if (unbanLog && unbanLog.target.id === ban.user.id) {
        const timeDiff = Date.now() - unbanLog.createdTimestamp;
        if (timeDiff < 5000) {
          moderator = unbanLog.executor;
          reason = unbanLog.reason || "No reason provided";
        }
      }
    } catch (error) {
      console.error("Could not fetch audit logs:", error.message);
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00) // Green
      .setTitle("🔓 User Unbanned")
      .setDescription(`**${ban.user.tag}** was unbanned from the server`)
      .addFields(
        {
          name: "User",
          value: `<@${ban.user.id}> (${ban.user.id})`,
          inline: true,
        },
        { name: "Moderator", value: `${moderator}`, inline: true },
        { name: "Reason", value: reason },
      )
      .setThumbnail(ban.user.displayAvatarURL({ size: 64 }))
      .setTimestamp()
      .setFooter({ text: `User ID: ${ban.user.id}` });

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Error sending unban log:", error);
    }
  },
};
