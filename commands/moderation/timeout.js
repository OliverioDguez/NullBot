const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user for a specific duration")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to timeout")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duration in minutes (1 - 40320)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the timeout"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const minutes = interaction.options.getInteger("minutes");
    const reason =
      interaction.options.getString("reason") || "Timeout by Sentinel Command";

    // Validation checks (before deferring - these are fast)
    if (!targetMember) {
      return interaction.reply({
        content: "That user is not currently in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetMember.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot timeout yourself 😅",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!targetMember.moderatable) {
      return interaction.reply({
        content:
          "❌ I cannot timeout this user. They might have a higher role than me or be the owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Defer for the actual timeout operation
    await interaction.deferReply();

    try {
      const durationMs = minutes * 60 * 1000;
      await targetMember.timeout(durationMs, reason);

      await interaction.editReply(
        `✅ **${targetMember.user.tag}** has been timed out for **${minutes}** minute(s).\nReason: *${reason}*`,
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "An error occurred while trying to timeout the user.",
      });
    }
  },
};
