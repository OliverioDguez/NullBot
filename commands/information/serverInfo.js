const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Displays detailed information about the server")
    // Disable this command in DMs (Direct Messages)
    .setDMPermission(false),

  // 2. EXECUTION
  async execute(interaction) {
    const guild = interaction.guild;

    // We defer the reply just in case fetching the owner takes a moment
    // (It's an API call that can sometimes be slow on large servers)
    await interaction.deferReply();

    try {
      // Fetch the owner object (returns a GuildMember)
      const owner = await guild.fetchOwner();

      const serverEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("Server Information")
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "Server Name", value: `${guild.name}`, inline: true },
          { name: "Server ID", value: `${guild.id}`, inline: true },
          { name: "Server Owner", value: `${owner.user.tag}`, inline: true },
          {
            name: "Server Member Count",
            value: `${guild.memberCount}`,
            inline: true,
          },
          {
            // Note: toLocaleString uses the server's locale system.
            // For a localized Discord timestamp, you could use <t:${Math.floor(guild.createdTimestamp / 1000)}:F>
            name: "Server Created At",
            value: `${guild.createdAt.toLocaleString()}`,
            inline: true,
          },
          {
            name: "Locale",
            value: `${guild.preferredLocale}`,
            inline: true,
          },
          {
            name: "Roles",
            value: `${guild.roles.cache.size}`,
            inline: true,
          }
        )
        // Check if banner exists before setting, though Discord.js handles null gracefully usually
        .setImage(guild.bannerURL({ size: 1024 }))
        .setFooter({
          text: `Nullbot • Requested by ${interaction.user.username}`,
        })
        .setTimestamp();

      // Send the embed (using editReply because we deferred)
      await interaction.editReply({ embeds: [serverEmbed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply("Could not fetch server information.");
    }
  },
};
