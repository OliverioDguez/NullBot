const express = require("express");
const router = express.Router();

const DISCORD_API = "https://discord.com/api/v10";
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.DASHBOARD_URL || "http://localhost:3000"}/auth/callback`;

/**
 * GET /auth/login — Redirect to Discord OAuth2
 */
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
  });
  res.redirect(`${DISCORD_API}/oauth2/authorize?${params}`);
});

/**
 * GET /auth/callback — Exchange code for token, fetch user data
 */
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/");

  try {
    // Exchange code for token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("OAuth2 token error:", tokenData);
      return res.redirect("/?error=token_failed");
    }

    // Fetch user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // Fetch user guilds
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    // Store in session
    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
    };
    req.session.guilds = guilds;
    req.session.accessToken = tokenData.access_token;

    res.redirect("/dashboard");
  } catch (error) {
    console.error("OAuth2 callback error:", error);
    res.redirect("/?error=auth_failed");
  }
});

/**
 * GET /auth/logout — Destroy session
 */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

/**
 * GET /auth/me — Return current user info
 */
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({
    user: req.session.user,
    guilds: req.session.guilds,
  });
});

module.exports = router;
