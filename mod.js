
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket paneli açar"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Destek Paneli")
      .setDescription("Kategori seç ve ticket aç.")
      .setColor("Blue");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("Kategori seç")
      .addOptions([
        { label: "Başvuru", value: "basvuru" },
        { label: "Yardım", value: "yardim" },
        { label: "Şikayet", value: "sikayet" }
      ]);

    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }
};
