const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { getWarnings } = require("../../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings for a user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to check warnings for")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    const warnings = getWarnings(interaction.guild.id, targetUser.id);

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 64 }))
      .setColor(warnings.length > 0 ? 0xffaa00 : 0x00ff00)
      .setTimestamp()
      .setFooter({ text: `User ID: ${targetUser.id}` });

    if (warnings.length === 0) {
      embed.setDescription("✅ This user has no warnings.");
    } else {
      embed.setDescription(`This user has **${warnings.length}** warning(s).`);

      // Show up to 10 most recent warnings
      const recentWarnings = warnings.slice(0, 10);
      for (const warn of recentWarnings) {
        const formattedDate = `<t:${Math.floor(warn.timestamp / 1000)}:R>`;
        embed.addFields({
          name: `#${warn.id} - ${formattedDate}`,
          value: `**Reason:** ${warn.reason || "No reason"}\n**By:** <@${warn.moderator_id}>`,
          inline: false,
        });
      }

      if (warnings.length > 10) {
        embed.addFields({
          name: "...",
          value: `And ${warnings.length - 10} more warning(s)`,
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
