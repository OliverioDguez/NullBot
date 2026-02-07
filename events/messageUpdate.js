const { Events, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.MessageUpdate,
  once: false,
  async execute(oldMessage, newMessage) {
    // Ignore bot messages and DMs
    if (newMessage.author?.bot || !newMessage.guild) return;

    // Ignore if content didn't change (could be embed update)
    if (oldMessage.content === newMessage.content) return;

    // Get log channel from config
    const config = getGuildConfig(newMessage.guild.id);
    if (!config?.log_channel) return;

    const channel = newMessage.guild.channels.cache.get(config.log_channel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("✏️ Message Edited")
      .setThumbnail(newMessage.author.displayAvatarURL({ size: 64 }))
      .addFields(
        {
          name: "Author",
          value: `${newMessage.author} (${newMessage.author.tag})`,
          inline: true,
        },
        { name: "Channel", value: `${newMessage.channel}`, inline: true },
        {
          name: "Before",
          value: oldMessage.content?.slice(0, 1024) || "*Empty*",
        },
        {
          name: "After",
          value: newMessage.content?.slice(0, 1024) || "*Empty*",
        },
      )
      .setFooter({ text: `Message ID: ${newMessage.id}` })
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send message edit log:", error.message);
    }
  },
};
