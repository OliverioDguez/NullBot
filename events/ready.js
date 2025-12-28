const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true, // This means it only runs once at the start
  execute(client) {
    console.log(`🛡️ Sentinel Core is ready as ${client.user.tag}`);
  },
};
