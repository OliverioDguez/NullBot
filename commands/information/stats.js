const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Display detailed server statistics"),

  async execute(interaction) {
    const guild = interaction.guild;

    // Fetch all members to get accurate counts
    await guild.members.fetch();

    // Member counts
    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const online = guild.members.cache.filter(
      (m) => m.presence?.status === "online",
    ).size;
    const idle = guild.members.cache.filter(
      (m) => m.presence?.status === "idle",
    ).size;
    const dnd = guild.members.cache.filter(
      (m) => m.presence?.status === "dnd",
    ).size;

    // Channel counts
    const textChannels = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText,
    ).size;
    const voiceChannels = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildVoice,
    ).size;
    const categories = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildCategory,
    ).size;
    const threads = guild.channels.cache.filter(
      (c) =>
        c.type === ChannelType.PublicThread ||
        c.type === ChannelType.PrivateThread,
    ).size;

    // Role and emoji counts
    const roles = guild.roles.cache.size - 1; // Exclude @everyone
    const emojis = guild.emojis.cache.size;
    const stickers = guild.stickers.cache.size;

    // Server info
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const createdAt = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setColor(config.colors.embed)
      .setTitle(`📊 ${guild.name} Statistics`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        {
          name: "👥 Members",
          value: [
            `Total: **${totalMembers}**`,
            `Humans: **${humans}**`,
            `Bots: **${bots}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🟢 Status",
          value: [
            `Online: **${online}**`,
            `Idle: **${idle}**`,
            `DND: **${dnd}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "💬 Channels",
          value: [
            `Text: **${textChannels}**`,
            `Voice: **${voiceChannels}**`,
            `Categories: **${categories}**`,
            `Threads: **${threads}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🎭 Other",
          value: [
            `Roles: **${roles}**`,
            `Emojis: **${emojis}**`,
            `Stickers: **${stickers}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🚀 Boost Status",
          value: [`Level: **${boostLevel}**`, `Boosts: **${boostCount}**`].join(
            "\n",
          ),
          inline: true,
        },
        {
          name: "📅 Created",
          value: `<t:${createdAt}:R>`,
          inline: true,
        },
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
