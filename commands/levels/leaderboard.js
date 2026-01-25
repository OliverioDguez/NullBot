const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server's XP leaderboard")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of users to show (max 25)")
        .setMinValue(5)
        .setMaxValue(25),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const limit = interaction.options.getInteger("limit") || 10;
    const leaderboard = getLeaderboard(limit);

    if (leaderboard.length === 0) {
      return interaction.editReply({
        content:
          "No one has earned any XP yet! Start chatting to be the first.",
      });
    }

    // Build leaderboard entries
    const entries = await Promise.all(
      leaderboard.map(async (entry, index) => {
        let username;
        try {
          const user = await interaction.client.users.fetch(entry.user_id);
          username = user.username;
        } catch {
          username = "Unknown User";
        }

        const medal =
          index === 0
            ? "🥇"
            : index === 1
              ? "🥈"
              : index === 2
                ? "🥉"
                : `**${index + 1}.**`;

        return `${medal} **${username}** — Level ${entry.level} (${entry.xp.toLocaleString()} XP)`;
      }),
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🏆 XP Leaderboard")
      .setDescription(entries.join("\n"))
      .setFooter({
        text: `Top ${leaderboard.length} users • Use /rank to check your progress`,
      })
      .setTimestamp();

    if (interaction.guild.iconURL()) {
      embed.setThumbnail(interaction.guild.iconURL({ size: 256 }));
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
