const express = require("express");
const session = require("express-session");
const path = require("path");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");

/**
 * Start the dashboard web server
 * @param {import('discord.js').Client} client - The Discord.js client instance
 */
function startDashboard(client) {
  const app = express();
  const PORT = process.env.DASHBOARD_PORT || 3000;

  // Store client reference for API access
  app.set("discordClient", client);

  // Middleware
  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nullbot-dashboard-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Static files
  app.use(express.static(path.join(__dirname, "public")));

  // Routes
  app.use("/auth", authRoutes);
  app.use("/api", apiRoutes);

  // SPA fallback — serve dashboard.html for authenticated routes
  app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  });

  // Root — serve login page
  app.get("/", (req, res) => {
    if (req.session.user) {
      return res.redirect("/dashboard");
    }
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
  });
}

module.exports = { startDashboard };
