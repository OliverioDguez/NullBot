require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Events, Collection } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

console.log("1. System starting (Slash Mode)...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // Useful if you want to keep logs
    GatewayIntentBits.GuildMembers, // Required for welcome messages
  ],
});

// --- SLASH COMMAND LOADER ---
client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

console.log("--- Loading Slash Modules ---");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // Verify new Slash structure (data and execute)
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ [/${command.data.name}] loaded.`);
  } else {
    // This warning is expected for files not yet migrated (like 8ball.js)
    console.log(
      `⚠️ The file ${file} is not a valid Slash Command (missing "data" or "execute").`
    );
  }
}
console.log("-----------------------------");

// --- EVENTS ---

client.once(Events.ClientReady, (c) => {
  console.log(`🛡️ Sentinel Core is ready as ${c.user.tag}`);
});

// (Optional) Welcome system
client.on(Events.GuildMemberAdd, (member) => {
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "general"
  );
  if (!channel) return;
  channel.send(`Welcome to the server, ${member}! 👋`);
});

// --- INTERACTION HANDLER ---
client.on(Events.InteractionCreate, async (interaction) => {
  // We only care about chat commands (Slash Commands)
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    // Safe error handling (if already replied, use followUp)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  }
});

// --- LOGIN ---
console.log("3. Attempting login...");
client.login(TOKEN);
