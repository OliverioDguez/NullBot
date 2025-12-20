require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Load environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // Optional: For instant updates in development

// Validation
if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Error: Missing environment variables.");
  console.error("Please check your .env file for DISCORD_TOKEN and CLIENT_ID.");
  process.exit(1);
}

const commands = [];
// Resolve path to commands folder
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

// Load command data
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `⚠️ Warning: The command at ${file} is missing "data" or "execute".`
    );
  }
}

// Prepare REST module
const rest = new REST().setToken(TOKEN);

// Deploy logic
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // Option A: Guild Deployment (Instant update for development)
    // Requires GUILD_ID in .env
    if (GUILD_ID) {
      console.log(`🚀 Deploying to Guild: ${GUILD_ID}`);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
    }
    // Option B: Global Deployment (Production - takes ~1 hour to propagate)
    else {
      console.log(`🌍 Deploying Globally...`);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    }

    console.log(`✅ Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
