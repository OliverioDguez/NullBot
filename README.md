# Nullbot

> A modular Discord.js v14 bot with XP leveling, moderation, automod, and anti-spam.

![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-v16.9%2B-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **XP Leveling System** - Users earn XP by chatting, with level-up announcements
- **Moderation Tools** - Ban, kick, timeout, warn with full logging
- **Warning System** - Progressive discipline with auto-timeout/kick/ban
- **Anti-Spam** - Automatic detection of message floods and duplicates
- **Automod** - Configurable banned words filter
- **Moderation Logging** - Logs all moderation actions, message edits/deletes, voice activity
- **Per-Server Configuration** - Each server can configure their own channels and settings
- **SQLite Database** - Persistent storage for user levels, XP, warnings, and configs

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
| `/config autoreply`        | Add an auto-reply trigger            |
| `/config removeautoreply`  | Remove an auto-reply trigger         |
| `/config autoreplies`      | View all auto-replies                |

### 🛡️ Moderation

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `/ban`           | Ban a user from the server     |
| `/unban`         | Unban a user by ID             |
| `/kick`          | Kick a user from the server    |
| `/timeout`       | Timeout a user for a duration  |
| `/untimeout`     | Remove timeout from a user     |
| `/warn`          | Warn a user for rule violation |
| `/warnings`      | View warnings for a user       |
| `/clearwarnings` | Clear all warnings for a user  |
| `/clear`         | Delete messages (up to 100)    |

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

| Command  | Description                    |
| -------- | ------------------------------ |
| `/8ball` | Ask the magic 8ball a question |
| `/coin`  | Flip a coin                    |
| `/poll`  | Create a poll (mods only)      |

## Warning System

Nullbot includes a progressive warning system:

| Warnings | Action         |
| -------- | -------------- |
| 1-2      | Warning only   |
| 3        | 1 hour timeout |
| 5        | Automatic kick |
| 7        | Automatic ban  |

Use `/warn` to warn users and `/warnings` to view their history.

## Anti-Spam

Nullbot automatically detects and handles spam:

| Type       | Trigger                | Action            |
| ---------- | ---------------------- | ----------------- |
| Duplicates | 4 same messages in 10s | Delete + Warn     |
| Flood      | 7 messages in 5s       | Delete + Warn     |
| Repeat     | 3+ spam warnings       | 10 minute timeout |

All spam actions are logged and count toward the warning system.

## Automod

Configurable word filter for your server:

1. Add banned words with `/config banword <word>`
2. When someone uses a banned word:
   - Message is automatically deleted
   - User is notified via DM
   - Action is logged to mod channel

## Moderation Logging

When configured with `/config logs #channel`, Nullbot logs:

- 🔨 **Bans/Unbans** - With moderator and reason
- 👢 **Kicks** - With moderator and reason
- ⏰ **Timeouts** - With duration and reason
- ⚠️ **Warnings** - With reason and count
- 🚨 **Anti-Spam** - Automatic spam detection
- 🗑️ **Message Deletes** - With original content
- ✏️ **Message Edits** - Before and after content
- 🔊 **Voice Activity** - Join, leave, and channel switches
- 🎭 **Role Changes** - Roles added or removed from users

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/2Oliverio/Nullbot.git
   cd Nullbot
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
Nullbot/
├── commands/
│   ├── admin/        # Server configuration
│   ├── fun/          # Fun commands
│   ├── information/  # Info commands
│   ├── levels/       # XP/Leveling commands
│   └── moderation/   # Mod commands + warnings
├── database/
│   └── db.js         # SQLite + XP + Config + Warnings
├── events/
│   ├── guildBanAdd.js       # Ban logging
│   ├── guildBanRemove.js    # Unban logging
│   ├── guildMemberAdd.js    # Welcome messages
│   ├── guildMemberUpdate.js # Role change logging
│   ├── interactionCreate.js # Command handler
│   ├── messageCreate.js     # XP + Automod + Anti-spam
│   ├── messageDelete.js     # Delete logging
│   ├── messageUpdate.js     # Edit logging
│   ├── voiceStateUpdate.js  # Voice logging
│   └── ready.js
├── utils/
│   └── modLog.js     # Moderation log utility
├── deploy-commands.js
└── index.js
```

## License

[MIT](LICENSE)
