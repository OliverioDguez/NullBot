const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { sendModLog } = require("../../utils/modLog");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a timeout from a user")
    // Target User
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to remove the timeout from")
        .setRequired(true),
    )
    // Reason (Optional)
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for removing the timeout"),
    )
    // Permission Lock
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const reason =
      interaction.options.getString("reason") ||
      "Timeout removed by Sentinel Command";

    // --- Safety Checks ---

    // 1. Check if user is in guild
    if (!targetMember) {
      return interaction.reply({
        content: "❌ That user is not currently in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 2. Check if user is actually timed out
    if (!targetMember.isCommunicationDisabled()) {
      return interaction.reply({
        content: "❌ This user is not currently timed out.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 3. Hierarchy Check (Bot vs Target)
    if (!targetMember.moderatable) {
      return interaction.reply({
        content:
          "❌ I cannot modify this user. They might have a higher role than me or be the owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Execution ---
    try {
      // Remove timeout by setting it to null
      await targetMember.timeout(null, reason);

      await interaction.reply(
        `✅ Timeout removed from **${targetMember.user.tag}**.\nReason: *${reason}*`,
      );

      // Send mod log
      await sendModLog(interaction.guild, {
        action: "untimeout",
        target: targetMember.user,
        moderator: interaction.user,
        reason,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ An error occurred while trying to remove the timeout.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
