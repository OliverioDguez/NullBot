const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the ban"),
    )
    .addIntegerOption((option) =>
      option
        .setName("delete_days")
        .setDescription("Number of days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const targetUser = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") || 0;

    // Validation checks (before deferring - these are fast)
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot ban yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        content: "I cannot ban myself!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetMember) {
      if (!targetMember.bannable) {
        return interaction.reply({
          content:
            "I cannot ban this user. They might have a higher role than me or be the server owner.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (
        interaction.member.roles.highest.position <=
        targetMember.roles.highest.position
      ) {
        return interaction.reply({
          content:
            "You cannot ban this user because they have an equal or higher role than you.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Defer for the actual ban operation
    await interaction.deferReply();

    try {
      await interaction.guild.members.ban(targetUser, {
        reason: reason,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      await interaction.editReply(
        `🔨 **${targetUser.tag}** has been banned from the server.\n**Reason:** ${reason}`,
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "Failed to ban the user. They might not be bannable.",
      });
    }
  },
};
