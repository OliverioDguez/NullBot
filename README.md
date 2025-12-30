# Sentinel: Discord.js Modular Boilerplate

> A robust, scalable, and clean architecture for Discord.js v14 bots with SQLite integration.

Sentinel is a boilerplate designed to solve the common "spaghetti code" problem in Discord bot development. It provides a solid foundation with separated concerns, dynamic handlers, and a pre-configured database connection, making it perfect for both small projects and large-scale applications.

## Features

- **Modular Architecture:** Commands and Events are separated into their own folders.
- **Dynamic Command Handler:** Supports sub-folders (categories) for better organization.
- **Event Handler:** Keeps your `index.js` clean by loading events dynamically.
- **SQLite Integration:** Pre-configured `better-sqlite3` setup for fast, synchronous local database management.
- **Centralized Config:** Manage colors, emojis, and IDs from a single `config.json` file.
- **Slash Commands:** Fully compatible with Discord's latest Slash Command system.

## Prerequisites

- Node.js (v16.9.0 or higher)
- A Discord Bot Token

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OliverioDguez/Sentinel.git](https://github.com/2Oliverio/Sentinel.git)

2. **Install dependencies**
   ```bash
   npm install

3. **Environment Setup Create a .env file in the root directory and add your credentials:**
   ```bash
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here  # Optional: For instant dev updates

4. **Configuration (Optional) Edit config.json to customize your bot's theme colors and common assets.**
   ```bash
   npm install

## Usage

1. Register Commands
Before starting the bot, you need to register your Slash Commands with Discord.

- **Global deploy
     ```bash
  node deploy-commands.js

2. Start the bot
   ```bash
     node index.js

You should see a message indicating that the commands, events, and database have been loaded successfully.

## Database Usage

The bot uses better-sqlite3. The connection is already set up in database/db.js.

### Example usage
     ```bash
     const { db } = require('../../database/db');
     // Execute SQL directly
     const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/2Oliverio/Sentinel/blob/main/LICENSE)
 file for details.
