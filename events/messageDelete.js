const { Events, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message) {
    // Ignore bot messages and DMs
    if (message.author?.bot || !message.guild) return;

    // Ignore if no content (could be embed-only message)
    if (!message.content && !message.attachments.size) return;

    // Get log channel from config
    const config = getGuildConfig(message.guild.id);
    if (!config?.log_channel) return;

    const channel = message.guild.channels.cache.get(config.log_channel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("🗑️ Message Deleted")
      .addFields(
        {
          name: "Author",
          value: message.author
            ? `${message.author} (${message.author.tag})`
            : "Unknown",
          inline: true,
        },
        { name: "Channel", value: `${message.channel}`, inline: true },
        {
          name: "Content",
          value: message.content?.slice(0, 1024) || "*No text content*",
        },
      )
      .setFooter({ text: `Message ID: ${message.id}` })
      .setTimestamp();

    // Add thumbnail if author is available
    if (message.author) {
      embed.setThumbnail(message.author.displayAvatarURL({ size: 64 }));
    }

    // Note if there were attachments
    if (message.attachments.size > 0) {
      embed.addFields({
        name: "Attachments",
        value: `${message.attachments.size} file(s) were attached`,
      });
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send message delete log:", error.message);
    }
  },
};
