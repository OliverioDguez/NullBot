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
      message.reply("Sentinel");
      break;

    case "avatar":
      const targetUser = message.mentions.users.first() || message.author;
      const avatarUrl = targetUser.displayAvatarURL({
        size: 1024,
        dynamic: true,
      });
      const avatarEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${targetUser.username}'s avatar`)
        .setImage(avatarUrl)
        .setFooter({
          text: `Requested by: ${message.author.username} ID ${targetUser.id}`,
        })
        .setTimestamp();
      message.reply({ embeds: [avatarEmbed] });
      break;

    case "8ball":
      if (args.length === 0) {
        message.reply("Please provide a question");
        break;
      }
      const box = [
        "Yes",
        "No",
        "Maybe",
        "Ask again",
        "I don't know",
        "That's for sure",
        "Never",
        "Always",
      ];
      const index = Math.floor(Math.random() * box.length);
      message.reply(box[index]);
      break;

    case "gif":
      if (args.length === 0) {
        message.reply("Please provide a search term");
        break;
      }
      const query = args.join(" ");
      try {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${query}&limit=10&rating=g`
        );
        const data = await response.json();

        if (data.data.length === 0) {
          message.reply("No results found");
          break;
        }
        const randomIndex = Math.floor(Math.random() * data.data.length);
        message.reply(data.data[randomIndex].url);
      } catch (error) {
        console.error(error);
        message.reply("An error occurred");
      }
      break;

    case "pokedex":
      if (args.length === 0) {
        message.reply("Please provide a Pokemon name");
        break;
      }
      const pokeName = args[0].toLowerCase();
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokeName}`
        );
        if (!response.ok) {
          message.reply("Pokemon not found");
          break;
        }
        const data = await response.json();

        // Data Extraction
        const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const id = data.id;
        const type = data.types.map((t) => t.type.name).join(", ");
        const hp = data.stats[0].base_stat;
        const atk = data.stats[1].base_stat;
        const def = data.stats[2].base_stat;
        const spriteHD =
          data.sprites.other["official-artwork"].front_default ||
          data.sprites.front_default;

        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(`${name} #${id}`)
          .setDescription(`**Types:** ${type}`)
          .addFields(
            { name: "HP", value: `${hp}`, inline: true },
            { name: "Attack", value: `${atk}`, inline: true },
            { name: "Defense", value: `${def}`, inline: true }
          )
          .setImage(spriteHD)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply("An error occurred");
      }
      break;

    case "coin":
    case "flip":
      const sides = ["Heads", "Tails"];
      const winningSide = sides[Math.floor(Math.random() * sides.length)];
      message.reply(`The coin landed on ${winningSide}`);
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
