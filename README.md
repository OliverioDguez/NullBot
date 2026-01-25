# Sentinel

> A modular Discord.js v14 bot with XP leveling and SQLite integration.

![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-v16.9%2B-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **XP Leveling System** - Users earn XP by chatting, with level-up announcements
- **Slash Commands** - Modern Discord slash command system
- **Modular Architecture** - Commands and events organized into folders
- **SQLite Database** - Persistent storage for user levels and XP
- **Graceful Shutdown** - Properly closes connections on exit

## Commands

### 📊 Levels

| Command        | Description                      |
| -------------- | -------------------------------- |
| `/rank`        | Check your level and XP progress |
| `/leaderboard` | View the server's top users      |

### 🎮 Fun

| Command    | Description                    |
| ---------- | ------------------------------ |
| `/8ball`   | Ask the magic 8ball a question |
| `/coin`    | Flip a coin                    |
| `/pokedex` | Look up Pokémon information    |

### ℹ️ Information

| Command       | Description                 |
| ------------- | --------------------------- |
| `/avatar`     | Display a user's avatar     |
| `/help`       | List all available commands |
| `/name`       | Show the bot's name         |
| `/ping`       | Check bot latency           |
| `/serverinfo` | Display server information  |

### 🛡️ Moderation

| Command    | Description                   |
| ---------- | ----------------------------- |
| `/ban`     | Ban a user from the server    |
| `/clear`   | Delete messages (up to 100)   |
| `/kick`    | Kick a user from the server   |
| `/timeout` | Timeout a user for a duration |

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/2Oliverio/Sentinel.git
   cd Sentinel
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file:

   ```env
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id  # Optional: for faster dev testing
   ```

4. **Deploy commands and start**
   ```bash
   npm start
   ```

## XP System

Users earn **15 XP** (±10) per message with a 60-second cooldown to prevent spam.

**Level Formula:** `Level = floor(0.1 × √XP) + 1`

| Level | XP Required |
| ----- | ----------- |
| 5     | 1,600       |
| 10    | 8,100       |
| 20    | 36,100      |
| 50    | 240,100     |

## Project Structure

```
Sentinel/
├── commands/
│   ├── fun/          # Fun commands
│   ├── information/  # Info commands
│   ├── levels/       # XP/Leveling commands
│   └── moderation/   # Mod commands
├── database/
│   └── db.js         # SQLite + XP functions
├── events/
│   ├── guildMemberAdd.js
│   ├── interactionCreate.js
│   ├── messageCreate.js  # XP tracking
│   └── ready.js
├── config.json
├── deploy-commands.js
└── index.js
```

## License

[MIT](LICENSE)
