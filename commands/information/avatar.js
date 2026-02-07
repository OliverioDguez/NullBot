const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Displays your avatar or the avatar of a mentioned user")
    .addUserOption(
      (option) =>
        option
          .setName("target")
          .setDescription("The user to show avatar for")
          .setRequired(false), // Optional: if empty, show yours
    ),
  async execute(interaction) {
    const targetUser =
      interaction.options.getUser("target") || interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({
      size: 1024,
    });
    const avatarEmbed = new EmbedBuilder()
      .setColor(config.colors.embed)
      .setTitle(`${targetUser.username}'s avatar`)
      .setImage(avatarUrl)
      .setFooter({
        text: `Requested by: ${interaction.user.username} ID ${targetUser.id}`,
      })
      .setTimestamp();
    await interaction.reply({ embeds: [avatarEmbed] });
  },
};
