const { EmbedBuilder, Events, AuditLogEvent } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const guild = newMember.guild;

    // Get log channel from config
    const config = getGuildConfig(guild.id);
    if (!config || !config.log_channel) return;

    const logChannel = guild.channels.cache.get(config.log_channel);
    if (!logChannel) return;

    // Check for role changes
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    // Find added roles
    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    // Find removed roles
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    // If no role changes, ignore
    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    // Try to get the moderator from audit logs
    let moderator = "Unknown";

    try {
      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
        limit: 1,
      });
      const roleLog = auditLogs.entries.first();

      // Check if the log is for this user and recent (within 5 seconds)
      if (roleLog && roleLog.target.id === newMember.id) {
        const timeDiff = Date.now() - roleLog.createdTimestamp;
        if (timeDiff < 5000) {
          moderator = roleLog.executor;
        }
      }
    } catch (error) {
      console.error("Could not fetch audit logs:", error.message);
    }

    // Create embed for added roles
    if (addedRoles.size > 0) {
      const roleNames = addedRoles.map((r) => `\`${r.name}\``).join(", ");
      const embed = new EmbedBuilder()
        .setColor(0x00ff00) // Green
        .setTitle("🎭 Role Added")
        .setDescription(`**${newMember.user.tag}** received new role(s)`)
        .addFields(
          { name: "User", value: `<@${newMember.id}>`, inline: true },
          { name: "Added By", value: `${moderator}`, inline: true },
          { name: "Role(s)", value: roleNames },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 64 }))
        .setTimestamp()
        .setFooter({ text: `User ID: ${newMember.id}` });

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Error sending role add log:", error);
      }
    }

    // Create embed for removed roles
    if (removedRoles.size > 0) {
      const roleNames = removedRoles.map((r) => `\`${r.name}\``).join(", ");
      const embed = new EmbedBuilder()
        .setColor(0xff6600) // Orange
        .setTitle("🎭 Role Removed")
        .setDescription(`**${newMember.user.tag}** lost role(s)`)
        .addFields(
          { name: "User", value: `<@${newMember.id}>`, inline: true },
          { name: "Removed By", value: `${moderator}`, inline: true },
          { name: "Role(s)", value: roleNames },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 64 }))
        .setTimestamp()
        .setFooter({ text: `User ID: ${newMember.id}` });

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Error sending role remove log:", error);
      }
    }
  },
};
