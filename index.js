require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

//////////////////////////////////////
// CLIENT
//////////////////////////////////////

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

//////////////////////////////////////
// SLASH KOMUTLAR
//////////////////////////////////////

const commands = [
  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Gelişmiş ticket paneli gönderir")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log("Slash komutlar yüklendi");
})();

//////////////////////////////////////
// READY
//////////////////////////////////////

client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);
});

//////////////////////////////////////
// TICKET PANEL
//////////////////////////////////////

function ticketPanel(channel) {

  const embed = new EmbedBuilder()
    .setTitle("🎫 Destek Sistemi")
    .setDescription(
      "Minecraft sunucusu destek paneli\n\n" +
      "📋 **Başvuru** → Yetkili başvurusu\n" +
      "❓ **Yardım** → Destek al\n" +
      "⚠️ **Şikayet** → Oyuncu bildir\n\n" +
      "⚡ Gereksiz ticket açmayın"
    )
    .setColor("#5865F2");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("Kategori seç")
    .addOptions([
      { label: "Başvuru", value: "basvuru", emoji: "📋" },
      { label: "Yardım", value: "yardim", emoji: "❓" },
      { label: "Şikayet", value: "sikayet", emoji: "⚠️" }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  channel.send({
    embeds: [embed],
    components: [row]
  });
}

//////////////////////////////////////
// INTERACTIONS
//////////////////////////////////////

client.on("interactionCreate", async interaction => {

  // Slash komut
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticketpanel") {
      ticketPanel(interaction.channel);
      return interaction.reply({
        content: "Panel gönderildi",
        ephemeral: true
      });
    }
  }

  // Ticket aç
  if (interaction.isStringSelectMenu()) {

    const categoryId = "1470077873455890597";

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎟️ Ticket Açıldı")
      .setDescription(
        `Merhaba ${interaction.user}\n` +
        "Sorununu yaz, yetkililer ilgilenecek."
      )
      .setColor("#57F287");

    const closeBtn = new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Ticket Kapat")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);

    channel.send({
      embeds: [embed],
      components: [row]
    });

    interaction.reply({
      content: `Ticket açıldı: ${channel}`,
      ephemeral: true
    });
  }

  // Ticket kapat
  if (interaction.isButton()) {
    if (interaction.customId === "ticket_close") {
      await interaction.reply("Ticket kapanıyor...");
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 2000);
    }
  }

});

//////////////////////////////////////

client.login(process.env.TOKEN);
