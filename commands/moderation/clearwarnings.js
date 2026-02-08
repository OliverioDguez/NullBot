const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { clearWarnings, getWarningCount } = require("../../database/db");
const { sendModLog } = require("../../utils/modLog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings for a user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to clear warnings for")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for clearing warnings"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const currentCount = getWarningCount(interaction.guild.id, targetUser.id);

    if (currentCount === 0) {
      return interaction.reply({
        content: `✅ **${targetUser.tag}** has no warnings to clear.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const cleared = clearWarnings(interaction.guild.id, targetUser.id);

    await interaction.reply(
      `✅ Cleared **${cleared}** warning(s) from **${targetUser.tag}**.\n**Reason:** ${reason}`,
    );

    // Send mod log
    await sendModLog(interaction.guild, {
      action: "clearwarnings",
      target: targetUser,
      moderator: interaction.user,
      reason,
      extra: `Cleared ${cleared} warning(s)`,
    });
  },
};
