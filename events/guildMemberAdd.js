const { Events, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const { getGuildConfig } = require("../database/db");
const { createCanvas, loadImage, GlobalFonts } = require("canvas");

// Apply basic system fonts if needed (canvas usually defaults to standard sans-serif)

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    const config = getGuildConfig(member.guild.id);

    if (!config?.welcome_channel) return;

    const channel = member.guild.channels.cache.get(config.welcome_channel);

    if (!channel) {
      console.warn(`⚠️ Welcome channel ${config.welcome_channel} not found in ${member.guild.name}`);
      return;
    }

    const botMember = member.guild.members.me;
    if (!channel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages) || !channel.permissionsFor(botMember).has(PermissionFlagsBits.AttachFiles)) {
      console.warn(`⚠️ Missing SendMessages/AttachFiles permission in #${channel.name} for ${member.guild.name}`);
      return;
    }

    try {
      // Create Canvas (800x300)
      const canvas = createCanvas(800, 300);
      const ctx = canvas.getContext("2d");

      // 1. Draw Sci-Fi Gradient Background
      // Deep Space Blue to Blurple
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0b0f19"); // Deep Space Blue
      gradient.addColorStop(0.5, "#1e1b4b"); // Midnight Purple
      gradient.addColorStop(1, "#4f46e5"); // Indigo / Blurple
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Add some "crystal" glassmorphism polygons in the background for texture
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(300, 300);
      ctx.lineTo(0, 300);
      ctx.fill();

      // 3. Load and Draw Avatar
      // Fetch avatar URL (ensure it's a PNG/JPG, not WebP)
      const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
      const avatar = await loadImage(avatarURL);

      // Draw Avatar Circle clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 150, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 100, 50, 200, 200);
      ctx.restore();

      // Draw a sleek glowing cyan border around the avatar
      ctx.beginPath();
      ctx.arc(200, 150, 100, 0, Math.PI * 2, true);
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#06b6d4"; // Cyan
      ctx.stroke();

      // 4. Draw Typography
      // "WELCOME" text
      ctx.font = "bold 48px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("B I E N V E N I D O", 340, 110);

      // Username text (cut off if too long)
      const rawUsername = member.user.username;
      let username = rawUsername.length > 15 ? rawUsername.substring(0, 12) + "..." : rawUsername;
      
      ctx.font = "bold 64px sans-serif";
      ctx.fillStyle = "#a5b4fc"; // Light lavender
      ctx.fillText(`@${username}`, 340, 190);

      // Member number
      ctx.font = "28px sans-serif";
      ctx.fillStyle = "#94a3b8"; // Slate text
      ctx.fillText(`Eres el miembro Nº ${member.guild.memberCount}`, 340, 240);

      // 5. Generate and Send Buffer
      const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "welcome.png" });

      await channel.send({ content: `¡Agárrense, **${member.user.username}** ha llegado a la nave! 🚀`, files: [attachment] });
    } catch (error) {
      console.error(`Failed to generate and send welcome image: ${error}`);
      // Fallback to text message if canvas generation fails
      await channel.send(`Welcome to the server, ${member}! 👋`).catch(() => {});
    }
  },
};
