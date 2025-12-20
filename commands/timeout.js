const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "timeout",
  description: "Timeout a user",
  async execute(message, args) {
    // 1. Permission check (Check the EXECUTOR, not the victim)
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return message.reply("You don't have permission to timeout members.");
    }

    // 2. Validate arguments: Get the member
    const member = message.mentions.members.first();
    if (!member) {
      return message.reply(
        "Please mention a user to timeout. Example: `!timeout @User 5`"
      );
    }

    // 3. Safety checks
    if (member.id === message.author.id) {
      return message.reply("You cannot timeout yourself 😅");
    }
    if (member.id === message.guild.ownerId) {
      return message.reply("You cannot timeout the server owner 👑");
    }

    // Hierarchy check (Can the bot moderate this user?)
    if (!member.moderatable) {
      return message.reply(
        "❌ I cannot timeout this user. They might have a higher role than me."
      );
    }

    // 4. Parse Duration
    // We try to find the number in the arguments.
    // We filter out the mention (which starts with <@) to find the time argument.
    const timeArg = args.find(
      (arg) => !arg.startsWith("<@") && !isNaN(parseInt(arg))
    );
    const minutes = timeArg ? parseInt(timeArg) : 1; // Default to 1 minute if no number found

    if (minutes < 1 || minutes > 40320) {
      return message.reply(
        "Please provide a valid duration between 1 and 40320 minutes."
      );
    }

    // 5. Execution
    try {
      const durationMs = minutes * 60 * 1000;
      // Optional: Join arguments that are NOT the time or the mention for the reason
      // This is a simple way to get the rest of the text as reason
      const reasonParts = args.filter(
        (arg) => !arg.startsWith("<@") && arg !== timeArg
      );
      const reason = reasonParts.join(" ") || "Timeout by Sentinel Command";

      await member.timeout(durationMs, reason);
      message.channel.send(
        `**${member.user.tag}** has been timed out for **${minutes}** minute(s).`
      );
    } catch (error) {
      console.error(error);
      message.reply(
        "An error occurred while trying to timeout the user. Check my permissions hierarchy!"
      );
    }
  },
};
