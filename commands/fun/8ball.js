const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  // 1. Definition
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8ball a question")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question you want to ask")
        .setRequired(true)
    ),

  // 2. Execution
  async execute(interaction) {
    // Get the question from options
    const question = interaction.options.getString("question");

    const box = [
      "Yes",
      "No",
      "Maybe",
      "Ask again",
      "I don't know",
      "That's for sure",
      "Never",
      "Always",
    ];

    const index = Math.floor(Math.random() * box.length);
    const answer = box[index];

    await interaction.reply(
      `🎱 **Question:** ${question}\n**Answer:** ${answer}`
    );
  },
};
