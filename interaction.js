
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Mesaj siler")
    .addIntegerOption(o =>
      o.setName("sayı")
        .setDescription("Silinecek mesaj sayısı")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: "Yetkin yok!", ephemeral: true });
    }

    const amount = interaction.options.getInteger("sayı");
    await interaction.channel.bulkDelete(amount);
    await interaction.reply({ content: `🧹 ${amount} mesaj silindi`, ephemeral: true });
  }
};
