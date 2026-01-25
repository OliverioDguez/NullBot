const { Events, PermissionFlagsBits } = require("discord.js");
const { welcomeChannel } = require("../config.json");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    // Find the welcome channel from config (case-insensitive)
    const channel = member.guild.channels.cache.find(
      (ch) => ch.name.toLowerCase() === welcomeChannel.toLowerCase(),
    );

    if (!channel) {
      console.warn(
        `⚠️ Welcome channel "${welcomeChannel}" not found in ${member.guild.name}`,
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
