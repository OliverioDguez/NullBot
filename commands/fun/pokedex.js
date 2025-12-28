const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  // 1. DEFINITION
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Search for information about a Pokémon")
    .addStringOption((option) =>
      option
        .setName("pokemon")
        .setDescription("The name of the Pokémon")
        .setRequired(true)
    ),

  // 2. EXECUTION
  async execute(interaction) {
    const pokeName = interaction.options.getString("pokemon").toLowerCase();

    // IMPORTANT: Defer the reply immediately.
    // This gives the bot up to 15 minutes to respond, avoiding the 3-second timeout error.
    await interaction.deferReply();

    try {
      // Fetch data from API
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokeName}`
      );

      // Handle 404 (Not Found)
      if (!response.ok) {
        // We use editReply because we already deferred (thinking state)
        return await interaction.editReply(
          `❌ I couldn't find a Pokémon named **${pokeName}**. Check the spelling!`
        );
      }

      const data = await response.json();

      // Data Extraction
      const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
      const id = data.id;
      // Extract types and capitalize them
      const type = data.types
        .map((t) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1))
        .join(", ");

      const hp = data.stats[0].base_stat;
      const atk = data.stats[1].base_stat;
      const def = data.stats[2].base_stat;
      // Fallback for sprite
      const spriteHD =
        data.sprites.other["official-artwork"].front_default ||
        data.sprites.front_default;

      // Build Embed
      const embed = new EmbedBuilder()
        .setColor(0xff0000) // Red like a Pokedex
        .setTitle(`${name} #${id}`)
        .setDescription(`**Types:** ${type}`)
        .addFields(
          { name: "HP", value: `${hp}`, inline: true },
          { name: "Attack", value: `${atk}`, inline: true },
          { name: "Defense", value: `${def}`, inline: true }
        )
        .setImage(spriteHD)
        .setFooter({ text: "Data provided by PokéAPI" })
        .setTimestamp();

      // Send the final result
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      // Fallback error message
      await interaction.editReply(
        "An error occurred while fetching the Pokémon data."
      );
    }
  },
};
