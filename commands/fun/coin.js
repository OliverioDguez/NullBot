const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coin")
    .setDescription("Flips a coin"),

  async execute(interaction) {
    const sides = ["Heads", "Tails"];
    const winningSide = sides[Math.floor(Math.random() * sides.length)];

    await interaction.reply(`The coin landed on ${winningSide}`);
  },
};
