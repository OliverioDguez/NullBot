require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { initDB } = require("./database/db");
const TOKEN = process.env.DISCORD_TOKEN;

console.log("1. System starting...");

// Initialize DB
// Note: ideally this should be awaited if using MySQL,
// but currently it runs in the background.
initDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates, // Required for voice channel logs
    GatewayIntentBits.MessageContent, // Required for XP system
  ],
});

// --- COMMAND HANDLER (Loads folders) ---
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

console.log("--- Loading Slash Modules ---");

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);

  // 🛠️ FIX: Ignore system files like .DS_Store
  // If it's not a directory, skip it.
  if (!fs.statSync(commandsPath).isDirectory()) {
    continue;
  }

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ [/${command.data.name}] loaded (Category: ${folder}).`);
    } else {
      console.log(`⚠️ Warning: ${file} missing data/execute.`);
    }
  }
}

// --- EVENT HANDLER (New!) ---
// Reads all files in the 'events' folder
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

console.log("--- Loading Events ---");

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  // Dynamically sets the event listener
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`🔔 Event loaded: ${event.name}`);
}
console.log("-----------------------------");

// --- LOGIN ---
client.login(TOKEN);

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log("\n🛑 Shutting down Nullbot gracefully...");
  client.destroy();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
