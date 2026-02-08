const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { addWarning, getWarningCount } = require("../../database/db");
const { sendModLog } = require("../../utils/modLog");

// Warning thresholds for auto-actions
const TIMEOUT_THRESHOLD = 3; // 3 warnings = 1 hour timeout
const KICK_THRESHOLD = 5; // 5 warnings = kick
const BAN_THRESHOLD = 7; // 7 warnings = ban

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user for rule violation")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to warn")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason");

    // --- Safety Checks ---

    // Check if user is in guild
    if (!targetMember) {
      return interaction.reply({
        content: "❌ That user is not in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Prevent self-warn
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ You cannot warn yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Prevent warning bots
    if (targetUser.bot) {
      return interaction.reply({
        content: "❌ You cannot warn bots.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check hierarchy
    if (
      targetMember.roles.highest.position >=
      interaction.member.roles.highest.position
    ) {
      return interaction.reply({
        content: "❌ You cannot warn someone with an equal or higher role.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Add Warning ---
    const warningId = addWarning(
      interaction.guild.id,
      targetUser.id,
      interaction.user.id,
      reason,
    );

    const warningCount = getWarningCount(interaction.guild.id, targetUser.id);

    // Send confirmation
    let response = `⚠️ **${targetUser.tag}** has been warned.\n`;
    response += `**Reason:** ${reason}\n`;
    response += `**Total Warnings:** ${warningCount}`;

    // --- Auto-Actions based on warning count ---
    let autoAction = null;

    if (warningCount >= BAN_THRESHOLD && targetMember.bannable) {
      try {
        await targetMember.ban({
          reason: `Auto-ban: ${warningCount} warnings`,
        });
        autoAction = `🔨 Auto-banned (${warningCount} warnings)`;
      } catch (e) {
        console.error("Auto-ban failed:", e.message);
      }
    } else if (warningCount >= KICK_THRESHOLD && targetMember.kickable) {
      try {
        await targetMember.kick(`Auto-kick: ${warningCount} warnings`);
        autoAction = `👢 Auto-kicked (${warningCount} warnings)`;
      } catch (e) {
        console.error("Auto-kick failed:", e.message);
      }
    } else if (warningCount >= TIMEOUT_THRESHOLD && targetMember.moderatable) {
      try {
        // 1 hour timeout
        await targetMember.timeout(
          60 * 60 * 1000,
          `Auto-timeout: ${warningCount} warnings`,
        );
        autoAction = `⏰ Auto-timed out for 1 hour (${warningCount} warnings)`;
      } catch (e) {
        console.error("Auto-timeout failed:", e.message);
      }
    }

    if (autoAction) {
      response += `\n\n**Auto-Action:** ${autoAction}`;
    }

    await interaction.reply(response);

    // Send mod log
    await sendModLog(interaction.guild, {
      action: "warn",
      target: targetUser,
      moderator: interaction.user,
      reason,
      extra: autoAction
        ? `Warning #${warningCount} - ${autoAction}`
        : `Warning #${warningCount}`,
    });

    // Try to DM the user
    try {
      let dmMessage = `⚠️ You have been warned in **${interaction.guild.name}**\n`;
      dmMessage += `**Reason:** ${reason}\n`;
      dmMessage += `**Total Warnings:** ${warningCount}`;
      if (autoAction) {
        dmMessage += `\n\n**Auto-Action Applied:** ${autoAction}`;
      }
      await targetUser.send(dmMessage);
    } catch {
      // User has DMs disabled
    }
  },
};
