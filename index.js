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
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

//////////////////////////////////////
// CLIENT
//////////////////////////////////////

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

//////////////////////////////////////
// SLASH KOMUTLAR
//////////////////////////////////////

const commands = [

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Ticket paneli gönderir"),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kullanıcı atar")
    .addUserOption(o =>
      o.setName("kullanici")
        .setDescription("Atılacak kişi")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kullanıcı banlar")
    .addUserOption(o =>
      o.setName("kullanici")
        .setDescription("Banlanacak kişi")
        .setRequired(true)
    )

].map(c => c.toJSON());

//////////////////////////////////////
// KOMUT REGISTER
//////////////////////////////////////

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
// TICKET PANEL
//////////////////////////////////////

function ticketPanel(channel) {
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
    content: "🎫 **Ticket Paneli**",
    components: [row]
  });
}

//////////////////////////////////////
// INTERACTIONS
//////////////////////////////////////

client.on("interactionCreate", async interaction => {

  //////////////////////////////////////
  // SLASH KOMUTLAR
  //////////////////////////////////////

  if (interaction.isChatInputCommand()) {

    // Ticket panel
    if (interaction.commandName === "ticketpanel") {
      ticketPanel(interaction.channel);
      return interaction.reply({
        content: "Panel gönderildi",
        ephemeral: true
      });
    }

    // Kick
    if (interaction.commandName === "kick") {
      if (!interaction.member.permissions.has(
        PermissionsBitField.Flags.KickMembers
      )) return interaction.reply({
        content: "Yetkin yok",
        ephemeral: true
      });

      const user = interaction.options.getMember("kullanici");
      await user.kick();

      return interaction.reply("Kullanıcı atıldı");
    }

    // Ban
    if (interaction.commandName === "ban") {
      if (!interaction.member.permissions.has(
        PermissionsBitField.Flags.BanMembers
      )) return interaction.reply({
        content: "Yetkin yok",
        ephemeral: true
      });

      const user = interaction.options.getMember("kullanici");
      await user.ban();

      return interaction.reply("Kullanıcı banlandı");
    }
  }

  //////////////////////////////////////
  // TICKET AÇ
  //////////////////////////////////////

  if (interaction.isStringSelectMenu()) {

    const categoryId = "1470077873455890597";

    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username}`
    );

    if (existing)
      return interaction.reply({
        content: "Zaten açık ticketin var",
        ephemeral: true
      });

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

    const closeBtn = new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Ticket Kapat")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);

    channel.send({
      content: `🎫 ${interaction.user}`,
      components: [row]
    });

    interaction.reply({
      content: `Ticket açıldı: ${channel}`,
      ephemeral: true
    });
  }

  //////////////////////////////////////
  // TICKET KAPAT
  //////////////////////////////////////

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
