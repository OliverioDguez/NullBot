const { EmbedBuilder, Events } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;

    // Get log channel from config
    const config = getGuildConfig(guild.id);
    if (!config || !config.log_channel) return;

    const logChannel = guild.channels.cache.get(config.log_channel);
    if (!logChannel) return;

    const member = newState.member || oldState.member;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    let embed;

    // User joined a voice channel
    if (!oldChannel && newChannel) {
      embed = new EmbedBuilder()
        .setColor(0x00ff00) // Green
        .setTitle("🔊 Voice Channel Join")
        .setDescription(`**${member.user.tag}** joined a voice channel`)
        .addFields(
          { name: "User", value: `<@${member.id}>`, inline: true },
          { name: "Channel", value: `🔊 ${newChannel.name}`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
        .setTimestamp()
        .setFooter({ text: `User ID: ${member.id}` });
    }
    // User left a voice channel
    else if (oldChannel && !newChannel) {
      embed = new EmbedBuilder()
        .setColor(0xff0000) // Red
        .setTitle("🔇 Voice Channel Leave")
        .setDescription(`**${member.user.tag}** left a voice channel`)
        .addFields(
          { name: "User", value: `<@${member.id}>`, inline: true },
          { name: "Channel", value: `🔊 ${oldChannel.name}`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
        .setTimestamp()
        .setFooter({ text: `User ID: ${member.id}` });
    }
    // User switched voice channels
    else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      embed = new EmbedBuilder()
        .setColor(0xffaa00) // Orange
        .setTitle("🔀 Voice Channel Switch")
        .setDescription(`**${member.user.tag}** switched voice channels`)
        .addFields(
          { name: "User", value: `<@${member.id}>`, inline: true },
          { name: "From", value: `🔊 ${oldChannel.name}`, inline: true },
          { name: "To", value: `🔊 ${newChannel.name}`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
        .setTimestamp()
        .setFooter({ text: `User ID: ${member.id}` });
    }

    // Send log if there's something to report
    if (embed) {
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Error sending voice log:", error);
      }
    }
  },
};
