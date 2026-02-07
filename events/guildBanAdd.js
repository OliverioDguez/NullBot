const { EmbedBuilder, Events, AuditLogEvent } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.GuildBanAdd,
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
        type: AuditLogEvent.MemberBanAdd,
        limit: 1,
      });
      const banLog = auditLogs.entries.first();

      // Check if the log is for this user and recent (within 5 seconds)
      if (banLog && banLog.target.id === ban.user.id) {
        const timeDiff = Date.now() - banLog.createdTimestamp;
        if (timeDiff < 5000) {
          moderator = banLog.executor;
          reason = banLog.reason || "No reason provided";
        }
      }
    } catch (error) {
      console.error("Could not fetch audit logs:", error.message);
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000) // Red
      .setTitle("🔨 User Banned")
      .setDescription(`**${ban.user.tag}** was banned from the server`)
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
      console.error("Error sending ban log:", error);
    }
  },
};
