const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("name")
    .setDescription("Replies with the bot's name"),

  // 2. EXECUTION
  async execute(interaction) {
    // Access the bot's user object through the interaction client
    const botName = interaction.client.user.username;

    // Reply to the user
    await interaction.reply(`My name is ${botName}`);
  },
};
