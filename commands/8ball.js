module.exports = {
  name: "8ball",
  description: "Replies with a random 8ball response",
  execute(message, args) {
    if (!args.length) {
      return message.reply("Please provide a question");
    }
    const box = [
      "Yes",
      "No",
      "Maybe",
      "Ask again",
      "I don't know",
      "That's for sure",
      "Never",
      "Always",
    ];
    const index = Math.floor(Math.random() * box.length);
    message.reply(box[index]);
  },
};
