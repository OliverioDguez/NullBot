# Sentinel

> A modular Discord.js v14 bot with XP leveling, moderation logging, and automod.

![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-v16.9%2B-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **XP Leveling System** - Users earn XP by chatting, with level-up announcements
- **Moderation Tools** - Ban, kick, timeout, clear messages with full logging
- **Automod** - Configurable banned words filter with automatic message deletion
- **Moderation Logging** - Logs bans, kicks, timeouts, message edits/deletes, voice activity, and role changes
- **Per-Server Configuration** - Each server can configure their own channels and settings
- **Slash Commands** - Modern Discord slash command system
- **SQLite Database** - Persistent storage for user levels, XP, and server configs

## Commands

### ⚙️ Admin

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `/config view`             | View current server configuration    |
| `/config welcome #channel` | Set welcome channel for new members  |
| `/config logs #channel`    | Set moderation log channel           |
| `/config levelup #channel` | Set level-up announcement channel    |
| `/config banword <word>`   | Add a word to the banned words list  |
| `/config unbanword <word>` | Remove a word from banned words list |
| `/config bannedwords`      | View list of banned words            |

### 🛡️ Moderation

| Command      | Description                   |
| ------------ | ----------------------------- |
| `/ban`       | Ban a user from the server    |
| `/unban`     | Unban a user by ID            |
| `/kick`      | Kick a user from the server   |
| `/timeout`   | Timeout a user for a duration |
| `/untimeout` | Remove timeout from a user    |
| `/clear`     | Delete messages (up to 100)   |

### 📊 Levels

| Command        | Description                      |
| -------------- | -------------------------------- |
| `/rank`        | Check your level and XP progress |
| `/leaderboard` | View the server's top users      |

### ℹ️ Information

| Command       | Description                 |
| ------------- | --------------------------- |
| `/avatar`     | Display a user's avatar     |
| `/stats`      | Display server statistics   |
| `/serverinfo` | Display server information  |
| `/help`       | List all available commands |
| `/ping`       | Check bot latency           |

### 🎮 Fun

| Command    | Description                    |
| ---------- | ------------------------------ |
| `/8ball`   | Ask the magic 8ball a question |
| `/coin`    | Flip a coin                    |
| `/pokedex` | Look up Pokémon information    |

## Moderation Logging

When configured with `/config logs #channel`, Sentinel logs:

- 🔨 **Bans/Unbans** - With moderator and reason
- 👢 **Kicks** - With moderator and reason
- ⏰ **Timeouts** - With duration and reason
- 🗑️ **Message Deletes** - With original content
- ✏️ **Message Edits** - Before and after content
- 🔊 **Voice Activity** - Join, leave, and channel switches
- 🎭 **Role Changes** - Roles added or removed from users

## Automod

Sentinel includes a configurable word filter:

1. Add banned words with `/config banword <word>`
2. When someone uses a banned word:
   - Message is automatically deleted
   - User is notified via DM
   - Action is logged to mod channel

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
   node deploy-commands.js
   node index.js
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
│   ├── admin/        # Server configuration
│   ├── fun/          # Fun commands
│   ├── information/  # Info commands
│   ├── levels/       # XP/Leveling commands
│   └── moderation/   # Mod commands
├── database/
│   └── db.js         # SQLite + XP + Config functions
├── events/
│   ├── guildBanAdd.js       # Ban logging
│   ├── guildBanRemove.js    # Unban logging
│   ├── guildMemberAdd.js    # Welcome messages
│   ├── guildMemberUpdate.js # Role change logging
│   ├── interactionCreate.js # Command handler
│   ├── messageCreate.js     # XP + Automod
│   ├── messageDelete.js     # Delete logging
│   ├── messageUpdate.js     # Edit logging
│   ├── voiceStateUpdate.js  # Voice logging
│   └── ready.js
├── utils/
│   └── modLog.js     # Moderation log utility
├── config.json
├── deploy-commands.js
└── index.js
```

## License

[MIT](LICENSE)
