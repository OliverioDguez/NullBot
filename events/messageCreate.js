const { Events, EmbedBuilder } = require("discord.js");
const { addXP, getBannedWords, getGuildConfig } = require("../database/db");

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    // --- AUTOMOD: Check for banned words ---
    const bannedWords = getBannedWords(message.guild.id);
    if (bannedWords.length > 0) {
      const messageContent = message.content.toLowerCase();
      const foundWord = bannedWords.find((word) =>
        messageContent.includes(word),
      );

      if (foundWord) {
        try {
          // Delete the message
          await message.delete();

          // Notify the user via DM
          try {
            await message.author.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xff0000)
                  .setTitle("⚠️ Message Removed")
                  .setDescription(
                    `Your message in **${message.guild.name}** was removed because it contained a banned word.`,
                  )
                  .setTimestamp(),
              ],
            });
          } catch {
            // User has DMs disabled, ignore
          }

          // Log to mod channel if configured
          const config = getGuildConfig(message.guild.id);
          if (config?.log_channel) {
            const logChannel = message.guild.channels.cache.get(
              config.log_channel,
            );
            if (logChannel) {
              const embed = new EmbedBuilder()
                .setColor(0xff6600)
                .setTitle("🚫 Automod: Banned Word Detected")
                .addFields(
                  {
                    name: "User",
                    value: `${message.author} (${message.author.id})`,
                    inline: true,
                  },
                  {
                    name: "Channel",
                    value: `<#${message.channel.id}>`,
                    inline: true,
                  },
                  { name: "Word", value: `||${foundWord}||`, inline: true },
                )
                .setThumbnail(message.author.displayAvatarURL({ size: 64 }))
                .setTimestamp()
                .setFooter({ text: "Message was automatically deleted" });

              await logChannel.send({ embeds: [embed] });
            }
          }

          return; // Don't process XP for deleted messages
        } catch (error) {
          console.error("Automod error:", error.message);
        }
      }
    }

    // --- XP SYSTEM ---
    // Add XP to user
    const result = addXP(message.author.id);

    // If user leveled up, send congratulations
    if (result && result.leveledUp) {
      // Check if there's a configured level-up channel
      const config = getGuildConfig(message.guild.id);
      const levelUpChannel = config?.level_up_channel
        ? message.guild.channels.cache.get(config.level_up_channel)
        : message.channel;

      try {
        await (levelUpChannel || message.channel).send(
          `🎉 Congratulations ${message.author}! You've reached **Level ${result.newLevel}**!`,
        );
      } catch (error) {
        // Silently fail if we can't send (permissions, etc.)
        console.error("Could not send level up message:", error.message);
      }
    }
  },
};
