require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Load environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Validation
if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Error: Missing environment variables.");
  console.error("Please check your .env file for DISCORD_TOKEN and CLIENT_ID.");
  process.exit(1);
}

const commands = [];
// 1. We point to the root command folder
const foldersPath = path.join(__dirname, "commands");
// 2. We read the FOLDERS (moderation, information, etc.)
const commandFolders = fs.readdirSync(foldersPath);

// 3. We iterate over each folder
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);

  // 🛠️ FIX: Ignore .DS_Store and non-directory files
  // This prevents the ENOTDIR crash on macOS
  if (!fs.statSync(commandsPath).isDirectory()) {
    continue;
  }

  // 4. We read the files .js INSIDE that folder
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `⚠️ Warning: The command at ${file} (Category: ${folder}) is missing "data" or "execute".`
      );
    }
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

    // Guild Deployment
    if (GUILD_ID) {
      console.log(`🚀 Deploying to Guild: ${GUILD_ID}`);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
    }
    // Global Deployment
    else {
      console.log(`🌍 Deploying Globally...`);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    }

    console.log(`✅ Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
// Asegúrate de que esta línea de arrib
