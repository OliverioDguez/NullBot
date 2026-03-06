const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Category display names and emojis
const CATEGORY_INFO = {
  admin: { emoji: "⚙️", name: "Admin" },
  moderation: { emoji: "🛡️", name: "Moderation" },
  information: { emoji: "ℹ️", name: "Information" },
  levels: { emoji: "⭐", name: "Levels" },
  fun: { emoji: "🎮", name: "Fun" },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays a list of available commands."),

  async execute(interaction) {
    const { commands } = interaction.client;

    // Group commands by category
    const categories = new Map();
    commands.forEach((cmd) => {
      const category = cmd.category || "other";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(cmd);
    });

    const helpEmbed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("🛡️ Nullbot | Command List")
      .setDescription(
        "Here are the commands currently loaded, grouped by category.",
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({
        text: `${commands.size} commands available • Type / to start`,
      })
      .setTimestamp();

    // Add one field per category (avoids the 25-field limit)
    for (const [category, cmds] of categories) {
      const info = CATEGORY_INFO[category] || { emoji: "📋", name: category };
      const commandList = cmds
        .map((cmd) => `\`/${cmd.data.name}\` — ${cmd.data.description}`)
        .join("\n");

      helpEmbed.addFields({
        name: `${info.emoji} ${info.name}`,
        value: commandList,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
