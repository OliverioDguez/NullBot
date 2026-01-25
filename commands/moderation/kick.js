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
    // Define the target user input
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to kick")
        .setRequired(true),
    )
    // Define an optional reason input
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the kick"),
    )
    // Enforce permissions (Users without KickMembers won't see this command)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    // Retrieve the target member object from the interaction
    const targetMember = interaction.options.getMember("target");
    // Retrieve the reason (or set a default one)
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // --- Validation Checks ---

    // Ensure the user is actually in the server
    if (!targetMember) {
      return interaction.reply({
        content: "That user is not currently in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Prevent self-kick
    if (targetMember.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot kick yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check bot hierarchy (Can the bot kick this person?)
    // Note: 'kickable' returns false if the target has higher roles than the bot
    if (!targetMember.kickable) {
      return interaction.reply({
        content:
          "I cannot kick this user. They might have a higher role than me or be the server owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Execution ---
    try {
      // Perform the kick with the reason provided
      await targetMember.kick(reason);

      // Send public confirmation
      await interaction.reply(
        `👢 **${targetMember.user.tag}** has been kicked from the server.\n**Reason:** ${reason}`,
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Failed to kick the user.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
