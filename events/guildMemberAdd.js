const { Events, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    // Get per-guild config from database
    const config = getGuildConfig(member.guild.id);

    if (!config?.welcome_channel) {
      return; // No welcome channel configured for this guild
    }

    // Find the welcome channel by ID
    const channel = member.guild.channels.cache.get(config.welcome_channel);

    if (!channel) {
      console.warn(
        `⚠️ Welcome channel ${config.welcome_channel} not found in ${member.guild.name}`,
      );
      return;
    }

    // Check if bot has permission to send messages
    const botMember = member.guild.members.me;
    if (
      !channel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages)
    ) {
      console.warn(
        `⚠️ Missing SendMessages permission in #${channel.name} for ${member.guild.name}`,
      );
      return;
    }

    try {
      await channel.send(`Welcome to the server, ${member}! 👋`);
    } catch (error) {
      console.error(`Failed to send welcome message: ${error.message}`);
    }
  },
};
