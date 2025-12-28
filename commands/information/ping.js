const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    const ping = interaction.client.ws.ping;
    await interaction.reply(`¡Pong! 🏓 Latency: ${ping}ms`);
  },
};
