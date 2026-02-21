const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    try {

      // ================= SLASH COMMAND =================
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction, client);
      }

      // ================= TICKET MENU =================
      if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== "ticket_menu") return;

        const STAFF_ROLES = process.env.STAFF_ROLES
          ? process.env.STAFF_ROLES.split(",")
          : [];

        const CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
        const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

        const type = interaction.values[0];
        const channelName = `${type}-${interaction.user.username}`;

        const existing = interaction.guild.channels.cache.find(
          c => c.name === channelName
        );

        if (existing) {
          return interaction.reply({
            content: "❌ Zaten açık bir ticketin var.",
            ephemeral: true
          });
        }

        // Permission setup
        const perms = [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          }
        ];

        STAFF_ROLES.forEach(role => {
          perms.push({
            id: role,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          });
        });

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: CATEGORY_ID || null,
          permissionOverwrites: perms
        });

        const closeButton = new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("🔒 Ticket Kapat")
          .setStyle(ButtonStyle.Danger);

        const embed = new EmbedBuilder()
          .setTitle("🎫 Ticket Açıldı")
          .setDescription(
            `Kategori: **${type}**\n\n` +
            `Yetkililer en kısa sürede ilgilenecek.\n\n` +
            `Kapatmak için aşağıdaki butonu kullanın.`
          )
          .setColor("Green")
          .setTimestamp();

        await channel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(closeButton)
          ]
        });

        await interaction.reply({
          content: `✅ Ticket oluşturuldu: ${channel}`,
          ephemeral: true
        });

        // Log
        if (LOG_CHANNEL_ID) {
          const logChannel =
            interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
          if (logChannel) {
            logChannel.send(
              `📂 Ticket açıldı: ${channel} | Kullanıcı: ${interaction.user.tag}`
            );
          }
        }
      }

      // ================= TICKET CLOSE =================
      if (interaction.isButton()) {

        if (interaction.customId !== "ticket_close") return;

        const STAFF_ROLES = process.env.STAFF_ROLES
          ? process.env.STAFF_ROLES.split(",")
          : [];

        const hasRole = interaction.member.roles.cache.some(r =>
          STAFF_ROLES.includes(r.id)
        );

        if (!hasRole) {
          return interaction.reply({
            content: "❌ Bu ticketi kapatamazsın.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 Ticket 5 saniye içinde kapanacak...");

        const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

        if (LOG_CHANNEL_ID) {
          const logChannel =
            interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
          if (logChannel) {
            logChannel.send(
              `🔒 Ticket kapandı: ${interaction.channel.name}`
            );
          }
        }

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);
      }

    } catch (err) {
      console.error("Interaction error:", err);

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          content: "❌ Bir hata oluştu.",
          ephemeral: true
        }).catch(() => {});
      } else {
        interaction.reply({
          content: "❌ Bir hata oluştu.",
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};
