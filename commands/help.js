const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Displays a list of available commands.",
  execute(message, args) {
    // 1. Get the collection of loaded commands
    const { commands } = message.client;

    // Get prefix to show correct usage examples
    const prefix = process.env.PREFIX || "!";

    // 2. Build the Embed
    const helpEmbed = new EmbedBuilder()
      .setColor(0x00aaff) // Sentinel Blue
      .setTitle("🛡️ Sentinel Core | Command List")
      .setDescription(
        "Here are the commands currently loaded and ready to use."
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setFooter({
        text: `Use ${prefix}command to execute • Sentinel Boilerplate`,
      })
      .setTimestamp();

    // 3. Generate fields dynamically
    // Use .map to transform each command into a field object
    const fields = commands.map((cmd) => {
      return {
        name: `${prefix}${cmd.name}`,
        // If no description, provide default text to avoid crash
        value: cmd.description || "No description available.",
        inline: true,
      };
    });

    // Add all fields to the embed
    // NOTE: Discord only allows 25 fields per embed.
    helpEmbed.addFields(fields);

    // 4. Send
    message.reply({ embeds: [helpEmbed] });
  },
};
