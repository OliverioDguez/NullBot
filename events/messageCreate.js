const { Events } = require("discord.js");
const { addXP } = require("../database/db");

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    // Add XP to user
    const result = addXP(message.author.id);

    // If user leveled up, send congratulations
    if (result && result.leveledUp) {
      try {
        await message.channel.send(
          `🎉 Congratulations ${message.author}! You've reached **Level ${result.newLevel}**!`,
        );
      } catch (error) {
        // Silently fail if we can't send (permissions, etc.)
        console.error("Could not send level up message:", error.message);
      }
    }
  },
};
