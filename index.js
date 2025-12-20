require("dotenv").config(); // 1. Load environment variables

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

// --- INITIAL SETUP ---
const PREFIX = process.env.PREFIX || "!";
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

// Modules
const pingCommand = require("./commands/ping.js");
const nameCommand = require("./commands/name.js");
const avatarCommand = require("./commands/avatar.js");
const eightBallCommand = require("./commands/8ball.js");
const pokedexCommand = require("./commands/pokedex.js");
const coinCommand = require("./commands/coin.js");
const clearCommand = require("./commands/clear.js");
const serverInfo = require("./commands/serverInfo.js");
const kick = require("./commands/kick.js");
const timeout = require("./commands/timeout.js");

// --- EVENT: CLIENT READY ---
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Ready! Logged in as ${c.user.tag}`);
});

// --- EVENT: GUILD MEMBER ADD (Welcome) ---
client.on(Events.GuildMemberAdd, (member) => {
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "general"
  );
  if (!channel) return;
  channel.send(`Welcome to the server, ${member}! 👋`);
});

// --- EVENT: MESSAGE CREATE (Command Handler) ---
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case "ping":
      pingCommand.execute(message, args);
      break;

    case "name":
      nameCommand.execute(message, args);
      break;

    case "avatar":
      avatarCommand.execute(message, args);
      break;

    case "8ball":
      eightBallCommand.execute(message, args);
      break;

    case "pokedex": {
      pokedexCommand.execute(message, args);
      break;
    }

    case "coin":
      coinCommand.execute(message, args);
      break;

    case "clear":
      clearCommand.execute(message, args);
      break;
    case "serverinfo":
      serverInfo.execute(message, args);
      break;
    case "kick":
      kick.execute(message, args);
      break;
    case "timeout":
      timeout.execute(message, args);
      break;
    default:
      // Empty default to avoid spamming "Invalid command"
      break;
  }
});

// --- FINAL LOGIN ---
console.log("3. Attempting login...");
client.login(TOKEN);
