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
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Slash komutlar yüklendi");
  } catch (err) {
    console.error(err);
  }
})();

//////////////////////////////////////
// READY
//////////////////////////////////////

client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);
});

//////////////////////////////////////
// TICKET PANEL FONKSİYONU
//////////////////////////////////////

function ticketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎫 Minecraft Destek Sistemi")
    .setDescription(
      "Aşağıdan kategori seçerek destek alabilirsin:\n\n" +
      "📋 **Başvuru** → Yetkili başvurusu\n" +
      "❓ **Yardım** → Teknik destek\n" +
      "⚠️ **Şikayet** → Oyuncu bildirimi\n\n" +
      "⚡ Aynı anda sadece 1 ticket açabilirsin."
    )
    .setColor("#5865F2");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("📂 Bir kategori seç")
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

  //////////////////////////////////////
  // SLASH KOMUT
  //////////////////////////////////////

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticketpanel") {
      ticketPanel(interaction.channel);
      return interaction.reply({
        content: "Ticket paneli gönderildi ✅",
        ephemeral: true
      });
    }
  }

  //////////////////////////////////////
  // TICKET AÇ
  //////////////////////////////////////

  if (interaction.isStringSelectMenu()) {

    await interaction.deferReply({ ephemeral: true });

    const categoryId = "1470077873455890597";

    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.editReply({
        content: "❌ Zaten açık ticketin var!"
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
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
      .setTitle("🎟️ Ticket Oluşturuldu")
      .setDescription(
        `Merhaba ${interaction.user}\n\n` +
        "Sorununu detaylı yaz.\n" +
        "Yetkililer yakında ilgilenecek."
      )
      .setColor("#57F287");

    const closeBtn = new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 Ticket Kapat")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.editReply({
      content: `✅ Ticket açıldı: ${channel}`
    });
  }

  //////////////////////////////////////
  // TICKET KAPAT
  //////////////////////////////////////

  if (interaction.isButton()) {
    if (interaction.customId === "ticket_close") {
      await interaction.reply({
        content: "⏳ Ticket kapanıyor...",
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 2000);
    }
  }

});

//////////////////////////////////////

client.login(process.env.TOKEN);
