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
    .setDescription("Kategori seç ve ticket aç")
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

      await interaction.reply({
        content: "Ticket açılıyor...",
        ephemeral: true
      });

      const categoryId = "1470077873455890597";

      const category = interaction.guild.channels.cache.get(categoryId);

      if (!category) {
        return interaction.editReply({
          content: "❌ Ticket kategorisi bulunamadı!"
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: categoryId
      });

      const embed = new EmbedBuilder()
        .setTitle("🎟️ Ticket Açıldı")
        .setDescription(`Merhaba ${interaction.user}`)
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
        content: `✅ Ticket: ${channel}`
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
