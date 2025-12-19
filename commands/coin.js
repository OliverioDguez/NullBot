module.exports = {
  name: "coin",
  description: "Flips a coin",
  execute(message, args) {
    const sides = ["Heads", "Tails"];
    const winningSide = sides[Math.floor(Math.random() * sides.length)];
    message.reply(`The coin landed on ${winningSide}`);
  },
};
