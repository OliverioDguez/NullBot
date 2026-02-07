const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { sendModLog } = require("../../utils/modLog");

module.exports = {
  // 1. Definition
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Deletes a specified number of messages (Max 100).")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 2. Execution
  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    // Defer reply immediately to prevent 3-second timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // bulkDelete returns a Collection of deleted messages
      const deleted = await interaction.channel.bulkDelete(amount, true);

      // Show actual count (messages older than 14 days are skipped)
      const actualCount = deleted.size;
      let message = `Successfully deleted **${actualCount}** message(s).`;

      if (actualCount < amount) {
        message += `\n⚠️ ${amount - actualCount} message(s) were older than 14 days and couldn't be deleted.`;
      }

      await interaction.editReply({
        content: message,
      });

      // Send mod log
      await sendModLog(interaction.guild, {
        action: "clear",
        moderator: interaction.user,
        reason: `Bulk deleted messages in #${interaction.channel.name}`,
        extra: `${actualCount} message(s) deleted`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "There was an error trying to prune messages in this channel.",
      });
    }
  },
};
