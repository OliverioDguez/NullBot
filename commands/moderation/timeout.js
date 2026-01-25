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
    // Target User
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to timeout")
        .setRequired(true),
    )
    // Duration (Minutes)
    .addIntegerOption(
      (option) =>
        option
          .setName("minutes")
          .setDescription("Duration in minutes (1 - 40320)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(40320), // Discord API limit is 28 days
    )
    // Reason (Optional)
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the timeout"),
    )
    // Permission Lock (User needs ModerateMembers to see this)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const minutes = interaction.options.getInteger("minutes");
    const reason =
      interaction.options.getString("reason") || "Timeout by Sentinel Command";

    // --- Safety Checks ---

    // 1. Check if user is in guild
    if (!targetMember) {
      return interaction.reply({
        content: "That user is not currently in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 2. Self-Harm Check
    if (targetMember.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot timeout yourself 😅",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 3. Hierarchy Check (Bot vs Target)
    if (!targetMember.moderatable) {
      return interaction.reply({
        content:
          "❌ I cannot timeout this user. They might have a higher role than me or be the owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Execution ---
    try {
      // Convert minutes to milliseconds
      const durationMs = minutes * 60 * 1000;

      await targetMember.timeout(durationMs, reason);

      await interaction.reply(
        `✅ **${targetMember.user.tag}** has been timed out for **${minutes}** minute(s).\nReason: *${reason}*`,
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while trying to timeout the user.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
