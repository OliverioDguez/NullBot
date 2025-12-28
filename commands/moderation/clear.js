const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

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
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 2. Execution
  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    try {
      await interaction.channel.bulkDelete(amount, true);

      await interaction.reply({
        content: `Successfully deleted **${amount}** messages.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error trying to prune messages in this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
