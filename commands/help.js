const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays a list of available commands."),

  // 2. EXECUTION
  async execute(interaction) {
    // Get the collection of loaded commands from the interaction client
    const { commands } = interaction.client;

    // 3. Build the Embed
    const helpEmbed = new EmbedBuilder()
      .setColor(0x00aaff) // Sentinel Blue
      .setTitle("🛡️ Sentinel Core | Command List")
      .setDescription(
        "Here are the commands currently loaded and ready to use."
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({
        text: `Type / to start a command • Sentinel Boilerplate`,
      })
      .setTimestamp();

    // 4. Generate fields dynamically
    const fields = commands.map((cmd) => {
      // IMPORTANT: In the new structure, name and description are inside 'data'
      // Using optional chaining (?.) for safety
      const name = cmd.data?.name || "unknown";
      const description = cmd.data?.description || "No description available.";

      return {
        name: `/${name}`, // Visually add '/' to indicate it's a slash command
        value: description,
        inline: true,
      };
    });

    // Add fields (Reminder: Discord allows max 25 fields per embed)
    // If you have more than 25 commands, this will error and require pagination.
    helpEmbed.addFields(fields);

    // 5. Send response
    // 'ephemeral: true' makes the list visible only to the user (optional)
    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
