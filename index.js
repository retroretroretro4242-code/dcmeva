
module.exports = client => {
  client.on("messageCreate", message => {
    if (message.author.bot) return;

    const badWords = ["küfür1", "küfür2"];
    if (badWords.some(w => message.content.toLowerCase().includes(w))) {
      message.delete().catch(() => {});
    }
  });
};
