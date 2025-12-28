const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  execute(member) {
    // Welcome logic
    const channel = member.guild.channels.cache.find(
      (ch) => ch.name === "general"
    );
    if (!channel) return;
    channel.send(`Welcome to the server, ${member}! 👋`);
  },
};
