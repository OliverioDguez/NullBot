const { Events, EmbedBuilder } = require("discord.js");
const {
  addXP,
  getBannedWords,
  getGuildConfig,
  addWarning,
  getWarningCount,
  getAutoReplies,
} = require("../database/db");

// --- ANTI-SPAM CONFIGURATION ---
const SPAM_MESSAGE_LIMIT = 5; // Messages within time window to trigger spam
const SPAM_TIME_WINDOW = 10000; // 10 seconds
const DUPLICATE_LIMIT = 4; // Same message repeated X times
const FLOOD_LIMIT = 7; // Messages in flood window
const FLOOD_TIME_WINDOW = 5000; // 5 seconds

// In-memory cache for tracking messages per user
// Structure: Map<guildId-userId, { messages: [{content, timestamp}], lastWarned: timestamp }>
const userMessageCache = new Map();

// Clean up old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userMessageCache.entries()) {
    // Remove entries older than 30 seconds
    data.messages = data.messages.filter((m) => now - m.timestamp < 30000);
    if (data.messages.length === 0) {
      userMessageCache.delete(key);
    }
  }
}, 60000);

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    const cacheKey = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();

    // --- ANTI-SPAM DETECTION ---
    // Get or create user cache entry
    if (!userMessageCache.has(cacheKey)) {
      userMessageCache.set(cacheKey, { messages: [], lastWarned: 0 });
    }
    const userData = userMessageCache.get(cacheKey);

    // Add current message to cache
    userData.messages.push({
      content: message.content.toLowerCase().trim(),
      timestamp: now,
    });

    // Keep only recent messages (within 30 seconds)
    userData.messages = userData.messages.filter(
      (m) => now - m.timestamp < 30000,
    );

    // Check for spam conditions
    const recentMessages = userData.messages.filter(
      (m) => now - m.timestamp < SPAM_TIME_WINDOW,
    );
    const floodMessages = userData.messages.filter(
      (m) => now - m.timestamp < FLOOD_TIME_WINDOW,
    );

    // Count duplicate messages
    const currentContent = message.content.toLowerCase().trim();
    const duplicates = recentMessages.filter(
      (m) => m.content === currentContent,
    );

    let isSpam = false;
    let spamReason = "";

    // Check for duplicate spam
    if (duplicates.length >= DUPLICATE_LIMIT) {
      isSpam = true;
      spamReason = `Sending the same message ${duplicates.length} times`;
    }
    // Check for flood spam
    else if (floodMessages.length >= FLOOD_LIMIT) {
      isSpam = true;
      spamReason = `Sending ${floodMessages.length} messages in ${FLOOD_TIME_WINDOW / 1000} seconds`;
    }

    // Handle spam detection
    if (isSpam && now - userData.lastWarned > 30000) {
      // Only warn once per 30 seconds
      userData.lastWarned = now;

      try {
        // Delete the spam message
        await message.delete();

        // Get the member for moderation actions
        const member = message.guild.members.cache.get(message.author.id);

        // Add warning
        addWarning(
          message.guild.id,
          message.author.id,
          message.client.user.id,
          `Anti-spam: ${spamReason}`,
        );
        const warningCount = getWarningCount(
          message.guild.id,
          message.author.id,
        );

        // Auto-timeout for repeat offenders
        let actionTaken = "Warned";
        if (warningCount >= 3 && member?.moderatable) {
          try {
            await member.timeout(10 * 60 * 1000, `Anti-spam: ${spamReason}`); // 10 min timeout
            actionTaken = "Timed out for 10 minutes";
          } catch {
            // Can't timeout, just warn
          }
        }

        // Notify user via DM
        try {
          await message.author.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff6600)
                .setTitle("⚠️ Anti-Spam Warning")
                .setDescription(
                  `You have been warned for spamming in **${message.guild.name}**.\n\n**Reason:** ${spamReason}\n**Action:** ${actionTaken}\n**Total Warnings:** ${warningCount}`,
                )
                .setTimestamp(),
            ],
          });
        } catch {
          // DMs disabled
        }

        // Log to mod channel
        const config = getGuildConfig(message.guild.id);
        if (config?.log_channel) {
          const logChannel = message.guild.channels.cache.get(
            config.log_channel,
          );
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xff6600)
              .setTitle("🚨 Anti-Spam Triggered")
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
                { name: "Reason", value: spamReason, inline: false },
                { name: "Action", value: actionTaken, inline: true },
                {
                  name: "Total Warnings",
                  value: `${warningCount}`,
                  inline: true,
                },
              )
              .setThumbnail(message.author.displayAvatarURL({ size: 64 }))
              .setTimestamp();

            await logChannel.send({ embeds: [embed] });
          }
        }

        return; // Don't process further
      } catch (error) {
        console.error("Anti-spam error:", error.message);
      }
    }

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

    // --- AUTO-REPLY SYSTEM ---
    const autoReplies = getAutoReplies(message.guild.id);
    const messageContent = message.content.toLowerCase().trim();

    // Check if message matches any trigger
    for (const [trigger, response] of Object.entries(autoReplies)) {
      if (messageContent.includes(trigger)) {
        try {
          await message.reply(response);
        } catch (error) {
          console.error("Auto-reply error:", error.message);
        }
        break; // Only reply once per message
      }
    }
  },
};
