const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../../database/db");

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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === "view") {
      const config = getGuildConfig(guildId);

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
        );
      }

      return interaction.reply({ embeds: [embed] });
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
