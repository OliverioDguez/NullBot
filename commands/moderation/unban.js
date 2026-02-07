const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { sendModLog } = require("../../utils/modLog");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server")
    // User ID (since banned users aren't in the server)
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription("The ID of the user to unban")
        .setRequired(true),
    )
    // Reason (Optional)
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the unban"),
    )
    // Permission Lock
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const userId = interaction.options.getString("user_id");
    const reason =
      interaction.options.getString("reason") || "Unbanned by Sentinel Command";

    // Validate user ID format
    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        content:
          "❌ Invalid user ID format. Please provide a valid Discord user ID.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Check if user is actually banned
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.get(userId);

      if (!bannedUser) {
        return interaction.reply({
          content: "❌ This user is not banned from this server.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Unban the user
      await interaction.guild.members.unban(userId, reason);

      await interaction.reply(
        `✅ **${bannedUser.user.tag}** has been unbanned.\nReason: *${reason}*`,
      );

      // Send mod log
      await sendModLog(interaction.guild, {
        action: "unban",
        target: bannedUser.user,
        moderator: interaction.user,
        reason,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ An error occurred while trying to unban the user.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
