const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Emoji numbers for poll options
const POLL_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll with up to 10 options")
    .addStringOption((option) =>
      option.setName("question").setDescription("The poll question").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option1").setDescription("First option").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option2").setDescription("Second option").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option3").setDescription("Third option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option4").setDescription("Fourth option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option5").setDescription("Fifth option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option6").setDescription("Sixth option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option7").setDescription("Seventh option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option8").setDescription("Eighth option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option9").setDescription("Ninth option (optional)")
    )
    .addStringOption((option) =>
      option.setName("option10").setDescription("Tenth option (optional)")
    )
    .setDMPermission(false),

  async execute(interaction) {
    const question = interaction.options.getString("question");

    // Collect all provided options
    const options = [];
    for (let i = 1; i <= 10; i++) {
      const opt = interaction.options.getString("option" + i);
      if (opt) options.push(opt);
    }

    // Build the poll description
    let description = "";
    for (let i = 0; i < options.length; i++) {
      description += POLL_EMOJIS[i] + " " + options[i] + "\n";
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 " + question)
      .setDescription(description)
      .setColor(0x5865f2)
      .setFooter({ text: "Poll by " + interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

    // Add reaction emojis for voting
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(POLL_EMOJIS[i]);
    }
  },
};
