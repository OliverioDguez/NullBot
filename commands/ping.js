module.exports = {
  name: "ping",
  description: "Replies with Pong!",
  execute(message, args) {
    const ping = message.client.ws.ping;
    message.reply(`¡Pong! 🏓 Latency: ${ping}ms`);
  },
};
