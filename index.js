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
  Routes
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "!";

//////////////////////////////////////
// SLASH KOMUT REGISTER
//////////////////////////////////////

const commands = [
  {
    name: "ticket",
    description: "Ticket paneli gönderir"
  }
];

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
    console.log("Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();

//////////////////////////////////////
// BOT READY
//////////////////////////////////////

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});

//////////////////////////////////////
// TICKET PANEL FONKSİYON
//////////////////////////////////////

async function sendTicketPanel(channel) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("Ticket kategorisi seç")
    .addOptions([
      { label: "Başvuru", value: "basvuru", emoji: "📋" },
      { label: "Yardım", value: "yardim", emoji: "❓" },
      { label: "Şikayet", value: "sikayet", emoji: "⚠️" }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  channel.send({
    content: "🎫 **Ticket Paneli**\nBir kategori seç:",
    components: [row]
  });
}

//////////////////////////////////////
// PREFIX KOMUTLAR
//////////////////////////////////////

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).split(" ");
  const cmd = args.shift().toLowerCase();

  // Ticket panel
  if (cmd === "ticketpanel") {
    sendTicketPanel(message.channel);
  }

  // Kick
  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return message.reply("Kullanıcı etiketle.");

    await user.kick();
    message.channel.send("Kullanıcı atıldı.");
  }

  // Ban
  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return message.reply("Kullanıcı etiketle.");

    await user.ban();
    message.channel.send("Kullanıcı banlandı.");
  }
});

//////////////////////////////////////
// SLASH KOMUT
//////////////////////////////////////

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticket") {
      await interaction.reply({ content: "Panel gönderildi.", ephemeral: true });
      sendTicketPanel(interaction.channel);
    }
  }

  //////////////////////////////////////
  // TICKET MENU
  //////////////////////////////////////

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== "ticket_menu") return;

    const categoryId = "1470077873455890597"; // ticket kategori ID

    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username}`
    );

    if (existing)
      return interaction.reply({
        content: "Zaten açık ticketin var!",
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
      content: `🎫 ${interaction.user} ticket açtı\nKategori: **${interaction.values[0]}**`,
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
      await interaction.reply({ content: "Ticket kapanıyor..." });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 2000);
    }
  }
});

//////////////////////////////////////

client.login(process.env.TOKEN);
