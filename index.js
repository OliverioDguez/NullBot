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
    case "flip":
      coinCommand.execute(message, args);
      break;

    case "clear":
    case "purge":
      if (
        !message.member.permissions.has(
          PermissionsBitField.Flags.ManageMessages
        )
      ) {
        message.reply("You don't have permissions to delete messages!");
        break;
      }

      if (args.length === 0) {
        message.reply(
          "Please specify how many messages to clear. Example: `!clear 5`"
        );
        break;
      }

      const amount = parseInt(args[0]);

      if (isNaN(amount)) {
        message.reply("That doesn't look like a number");
        break;
      } else if (amount < 1 || amount > 100) {
        message.reply("Please provide a number between 1 and 100");
        break;
      }

      try {
        const deletedMessages = await message.channel.bulkDelete(amount, true);
        const confirmationMsg = await message.channel.send(
          `Successfully deleted **${deletedMessages.size}** messages.`
        );
        setTimeout(() => {
          confirmationMsg.delete().catch(() => {});
        }, 3000);
      } catch (error) {
        console.error(error);
        message.reply("There was an error trying to prune messages.");
      }
      break;
    case "serverinfo":
    case "server":
      const guild = message.guild;
      const owner = await guild.fetchOwner();

      const serverEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("Server Information")
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "Server Name", value: `${guild.name}`, inline: true },
          { name: "Server ID", value: `${guild.id}`, inline: true },
          { name: "Server Owner", value: `${owner.user.tag}`, inline: true },

          {
            name: "Server Member Count",
            value: `${guild.memberCount}`,
            inline: true,
          },

          {
            name: "Server Created At",
            value: `${guild.createdAt.toLocaleString()}`,
            inline: true,
          },
          { name: "Locale", value: `${guild.preferredLocale}`, inline: true },

          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true }
        )
        .setImage(guild.bannerURL({ size: 1024 }))
        .setFooter({
          text: `Sentinel • Requested by ${message.author.username}`,
        })
        .setTimestamp();

      message.reply({ embeds: [serverEmbed] });
      break;
    default:
      // Empty default to avoid spamming "Invalid command"
      break;
  }
});

// --- FINAL LOGIN ---
console.log("3. Attempting login...");
client.login(TOKEN);
