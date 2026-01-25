const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, getUserRank, xpForLevel } = require("../../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your level and XP progress")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to check rank for")
        .setRequired(false),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user") || interaction.user;
    const userData = getUser(targetUser.id);

    if (!userData) {
      return interaction.editReply({
        content: `${targetUser.username} hasn't earned any XP yet! Start chatting to level up.`,
      });
    }

    const rank = getUserRank(targetUser.id);
    const currentXP = userData.xp;
    const currentLevel = userData.level;
    const xpForCurrentLevel = xpForLevel(currentLevel);
    const xpForNextLevel = xpForLevel(currentLevel + 1);
    const progressXP = currentXP - xpForCurrentLevel;
    const neededXP = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = Math.min(
      100,
      Math.floor((progressXP / neededXP) * 100),
    );

    // Create progress bar
    const progressBarLength = 20;
    const filledBars = Math.floor((progressPercent / 100) * progressBarLength);
    const emptyBars = progressBarLength - filledBars;
    const progressBar = "█".repeat(filledBars) + "░".repeat(emptyBars);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${targetUser.username}'s Rank`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🏆 Rank", value: `#${rank}`, inline: true },
        { name: "⭐ Level", value: `${currentLevel}`, inline: true },
        {
          name: "✨ Total XP",
          value: `${currentXP.toLocaleString()}`,
          inline: true,
        },
        {
          name: `Progress to Level ${currentLevel + 1}`,
          value: `${progressBar}\n${progressXP.toLocaleString()} / ${neededXP.toLocaleString()} XP (${progressPercent}%)`,
          inline: false,
        },
      )
      .setFooter({ text: "Keep chatting to earn more XP!" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
