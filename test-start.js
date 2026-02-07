console.log("1. Script start");

try {
  console.log("2. Loading dotenv...");
  require("dotenv").config();
  console.log("3. Dotenv loaded.");

  console.log("4. Loading fs/path...");
  const fs = require("fs");
  const path = require("path");
  console.log("5. fs/path loaded.");

  console.log("6. Loading discord.js...");
  const { Client } = require("discord.js");
  console.log("7. discord.js loaded.");

  console.log("8. Loading database/db...");
  const { initDB } = require("./database/db");
  console.log("9. database/db loaded.");

  console.log("10. Calling initDB()...");
  initDB();
  console.log("11. initDB() done.");
} catch (err) {
  console.error("CRASH:", err);
}
