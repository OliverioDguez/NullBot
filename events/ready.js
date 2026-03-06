const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true, // This means it only runs once at the start
  execute(client) {
    console.log(`🛡️ Nullbot is ready as ${client.user.username}`);
  },
};
