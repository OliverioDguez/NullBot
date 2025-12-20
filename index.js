require("dotenv").config();
const fs = require("fs"); // Required to read the file system
const {
  Client,
  GatewayIntentBits,
  Events,
  Collection, // Required to store commands in memory
} = require("discord.js");

// --- INITIAL SETUP ---
const PREFIX = process.env.PREFIX || "-";
const TOKEN = process.env.DISCORD_TOKEN;

console.log("1. System starting...");
console.log(`2. Active PREFIX:: [${PREFIX}]`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// --- DYNAMIC COMMAND HANDLER ---
// This Collection will hold all your command files
client.commands = new Collection();

// Read the 'commands' folder
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

console.log("--- Loading Modules ---");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // Check if the command file has the required structure
  if ("name" in command && "execute" in command) {
    client.commands.set(command.name, command);
    console.log(`✅ [${command.name}] module loaded.`);
  } else {
    console.log(
      `⚠️ Warning: The command at ${file} is missing "name" or "execute".`
    );
  }
}
console.log("-----------------------");

// --- EVENTS ---

client.once(Events.ClientReady, (c) => {
  console.log(`Sentinel is online as ${c.user.tag}`);
});

client.on(Events.GuildMemberAdd, (member) => {
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "general"
  );
  if (!channel) return;
  channel.send(`Welcome to the server, ${member}! 👋`);
});

// --- MESSAGE EVENT (Dynamic Handler) ---
client.on(Events.MessageCreate, async (message) => {
  // Ignore bots and messages without prefix
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Check if the command exists in our Collection
  const command = client.commands.get(commandName);

  if (!command) return; // Command not found, do nothing

  try {
    // Execute the command file
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("There was an error executing that command!");
  }
});

// --- LOGIN ---
console.log("3. Attempting login...");
client.login(TOKEN);
