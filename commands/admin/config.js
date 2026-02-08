const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const {
  getGuildConfig,
  setGuildConfig,
  getBannedWords,
  addBannedWord,
  removeBannedWord,
} = require("../../database/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure bot settings for this server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View current server configuration"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcome")
        .setDescription("Set the welcome channel for new members")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel for welcome messages")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("Set the moderation log channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel for moderation logs")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("levelup")
        .setDescription("Set the level-up announcement channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel for level-up announcements")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    // Automod subcommands
    .addSubcommand((subcommand) =>
      subcommand
        .setName("banword")
        .setDescription("Add a word to the banned words list")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("The word to ban")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unbanword")
        .setDescription("Remove a word from the banned words list")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("The word to unban")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bannedwords")
        .setDescription("View the list of banned words"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // View configuration
    if (subcommand === "view") {
      const config = getGuildConfig(guildId);
      const bannedWords = getBannedWords(guildId);

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Server Configuration")
        .setColor("#5865F2")
        .setTimestamp();

      if (!config) {
        embed.setDescription(
          "No configuration set for this server yet.\nUse `/config welcome`, `/config logs`, or `/config levelup` to configure.",
        );
      } else {
        const welcomeChannel = config.welcome_channel
          ? `<#${config.welcome_channel}>`
          : "Not set";
        const logChannel = config.log_channel
          ? `<#${config.log_channel}>`
          : "Not set";
        const levelUpChannel = config.level_up_channel
          ? `<#${config.level_up_channel}>`
          : "Not set";

        embed.addFields(
          { name: "👋 Welcome Channel", value: welcomeChannel, inline: true },
          { name: "📋 Log Channel", value: logChannel, inline: true },
          { name: "🎉 Level-Up Channel", value: levelUpChannel, inline: true },
          {
            name: "🚫 Banned Words",
            value:
              bannedWords.length > 0 ? `${bannedWords.length} word(s)` : "None",
            inline: true,
          },
        );
      }

      return interaction.reply({ embeds: [embed] });
    }

    // View banned words
    if (subcommand === "bannedwords") {
      const words = getBannedWords(guildId);

      const embed = new EmbedBuilder()
        .setTitle("🚫 Banned Words List")
        .setColor("#FF0000")
        .setTimestamp();

      if (words.length === 0) {
        embed.setDescription(
          "No banned words configured.\nUse `/config banword <word>` to add words.",
        );
      } else {
        // Show words with spoiler tags for privacy
        const wordList = words.map((w) => `||${w}||`).join(", ");
        embed.setDescription(wordList);
        embed.setFooter({ text: `Total: ${words.length} word(s)` });
      }

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Add banned word
    if (subcommand === "banword") {
      const word = interaction.options.getString("word");
      const added = addBannedWord(guildId, word);

      if (added) {
        return interaction.reply({
          content: `✅ Added ||${word.toLowerCase()}|| to the banned words list.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          content: `⚠️ The word ||${word.toLowerCase()}|| is already banned.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Remove banned word
    if (subcommand === "unbanword") {
      const word = interaction.options.getString("word");
      const removed = removeBannedWord(guildId, word);

      if (removed) {
        return interaction.reply({
          content: `✅ Removed ||${word.toLowerCase()}|| from the banned words list.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          content: `❌ The word ||${word.toLowerCase()}|| is not in the banned list.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Handle setting channels
    const channel = interaction.options.getChannel("channel");
    let configKey;
    let successMessage;

    switch (subcommand) {
      case "welcome":
        configKey = "welcome_channel";
        successMessage = `✅ Welcome channel set to ${channel}`;
        break;
      case "logs":
        configKey = "log_channel";
        successMessage = `✅ Log channel set to ${channel}`;
        break;
      case "levelup":
        configKey = "level_up_channel";
        successMessage = `✅ Level-up channel set to ${channel}`;
        break;
    }

    try {
      setGuildConfig(guildId, configKey, channel.id);
      return interaction.reply({ content: successMessage });
    } catch (error) {
      console.error("Config error:", error);
      return interaction.reply({
        content: "❌ Failed to save configuration.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
