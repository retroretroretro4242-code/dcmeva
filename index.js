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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

//////////////////////////////////////
// SLASH REGISTER
//////////////////////////////////////

const commands = [
  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Ticket paneli gönderir")
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
    console.error("Slash error:", err);
  }
})();

//////////////////////////////////////

client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);
});

//////////////////////////////////////
// PANEL
//////////////////////////////////////

function ticketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎫 Destek Paneli")
    .setDescription("Kategori seç ve ticket aç. Her ticket özel izinlerle açılır; yalnızca siz ve yetkililer görebilir.")
    .setColor("#5865F2");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("Kategori seç")
    .addOptions([
      { label: "Başvuru", value: "basvuru", emoji: "📋", description: "Başvuru yapmak için aç" },
      { label: "Yardım", value: "yardim", emoji: "❓", description: "Sorularını sormak için aç" },
      { label: "Şikayet", value: "sikayet", emoji: "⚠️", description: "Şikayetini iletmek için aç" }
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

  try {

    // Slash
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticketpanel") {
        ticketPanel(interaction.channel);
        return interaction.reply({
          content: "Panel gönderildi ✅",
          ephemeral: true
        });
      }
    }

    // Ticket aç
    if (interaction.isStringSelectMenu()) {

      await interaction.deferReply({ ephemeral: true }); // artık takılmıyor

      const categoryId = "1472161215034822762";

      const category = interaction.guild.channels.cache.get(categoryId);

      if (!category) {
        return interaction.editReply({
          content: "❌ Ticket kategorisi bulunamadı!"
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ],
          },
          {
            id: "1474568875634065428",
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle("🎟️ Ticket Açıldı")
        .setDescription(`Merhaba ${interaction.user}\nTicket sadece siz ve yetkililer tarafından görülebilir.`)
        .setColor("#57F287");

      const closeBtn = new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Ticket Kapat")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeBtn);

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Ticket başarıyla açıldı: ${channel}`
      });
    }

    // Kapat
    if (interaction.isButton()) {
      if (interaction.customId === "ticket_close") {
        await interaction.reply("Kapanıyor...");
        setTimeout(() => interaction.channel.delete(), 2000);
      }
    }

  } catch (err) {
    console.error("Interaction error:", err);

    if (!interaction.replied) {
      interaction.reply({
        content: "❌ Hata oluştu!",
        ephemeral: true
      }).catch(() => {});
    }
  }

});

//////////////////////////////////////

client.login(process.env.TOKEN);
