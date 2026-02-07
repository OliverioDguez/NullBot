const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { sendModLog } = require("../../utils/modLog");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    // Define the target user input
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to ban")
        .setRequired(true),
    )
    // Define an optional reason input
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the ban"),
    )
    // Define an optional delete messages duration
    .addIntegerOption((option) =>
      option
        .setName("delete_days")
        .setDescription("Number of days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    )
    // Enforce permissions (Users without BanMembers won't see this command)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    // Retrieve the target member object from the interaction
    const targetMember = interaction.options.getMember("target");
    const targetUser = interaction.options.getUser("target");
    // Retrieve the reason (or set a default one)
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    // Get delete days (default to 0)
    const deleteDays = interaction.options.getInteger("delete_days") || 0;

    // --- Validation Checks ---

    // Prevent self-ban
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot ban yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Prevent banning the bot itself
    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        content: "I cannot ban myself!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // If the user is in the server, check hierarchy
    if (targetMember) {
      // Check bot hierarchy (Can the bot ban this person?)
      if (!targetMember.bannable) {
        return interaction.reply({
          content:
            "I cannot ban this user. They might have a higher role than me or be the server owner.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check if executor has higher role than target
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

    // --- Execution ---
    try {
      // Perform the ban with the reason and delete messages
      await interaction.guild.members.ban(targetUser, {
        reason: reason,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      // Send public confirmation
      await interaction.reply(
        `🔨 **${targetUser.tag}** has been banned from the server.\n**Reason:** ${reason}`,
      );

      // Send mod log
      await sendModLog(interaction.guild, {
        action: "ban",
        target: targetUser,
        moderator: interaction.user,
        reason,
        extra:
          deleteDays > 0 ? `Deleted ${deleteDays} day(s) of messages` : null,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Failed to ban the user. They might not be bannable.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
