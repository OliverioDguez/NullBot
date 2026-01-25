const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the kick"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Validation checks (before deferring - these are fast)
    if (!targetMember) {
      return interaction.reply({
        content: "That user is not currently in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetMember.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot kick yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!targetMember.kickable) {
      return interaction.reply({
        content:
          "I cannot kick this user. They might have a higher role than me or be the server owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Defer for the actual kick operation
    await interaction.deferReply();

    try {
      await targetMember.kick(reason);

      await interaction.editReply(
        `👢 **${targetMember.user.tag}** has been kicked from the server.\n**Reason:** ${reason}`,
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "Failed to kick the user.",
      });
    }
  },
};
