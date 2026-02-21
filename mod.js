const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const warnings = new Map(); // RAM warn sistemi

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderasyon komutları")
    .addSubcommand(s =>
      s.setName("ban")
        .setDescription("Kullanıcı banlar")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Banlanacak kişi")
            .setRequired(true))
        .addStringOption(o =>
          o.setName("sebep")
            .setDescription("Ban sebebi")
            .setRequired(false)))
    .addSubcommand(s =>
      s.setName("kick")
        .setDescription("Kullanıcı atar")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Atılacak kişi")
            .setRequired(true)))
    .addSubcommand(s =>
      s.setName("mute")
        .setDescription("Kullanıcı susturur")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Susturulacak kişi")
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName("dakika")
            .setDescription("Kaç dakika?")
            .setRequired(true)))
    .addSubcommand(s =>
      s.setName("clear")
        .setDescription("Mesaj siler")
        .addIntegerOption(o =>
          o.setName("sayı")
            .setDescription("Silinecek mesaj")
            .setRequired(true)))
    .addSubcommand(s =>
      s.setName("warn")
        .setDescription("Uyarı verir")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Uyarılacak kişi")
            .setRequired(true))
        .addStringOption(o =>
          o.setName("sebep")
            .setDescription("Sebep")
            .setRequired(true)))
    .addSubcommand(s =>
      s.setName("warnings")
        .setDescription("Uyarıları gösterir")
        .addUserOption(o =>
          o.setName("kullanıcı")
            .setDescription("Kişi")
            .setRequired(true))),

  async execute(interaction) {

    const sub = interaction.options.getSubcommand();
    const logChannel = process.env.LOG_CHANNEL_ID
      ? interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID)
      : null;

    // ================= BAN =================
    if (sub === "ban") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

      const user = interaction.options.getUser("kullanıcı");
      const reason = interaction.options.getString("sebep") || "Sebep yok";

      await interaction.guild.members.ban(user, { reason });

      interaction.reply(`🔨 ${user.tag} banlandı.`);

      if (logChannel)
        logChannel.send(`🔨 ${user.tag} banlandı | Sebep: ${reason}`);
    }

    // ================= KICK =================
    if (sub === "kick") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers))
        return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

      const member = interaction.options.getMember("kullanıcı");

      await member.kick();
      interaction.reply(`👢 ${member.user.tag} atıldı.`);

      if (logChannel)
        logChannel.send(`👢 ${member.user.tag} atıldı.`);
    }

    // ================= MUTE =================
    if (sub === "mute") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

      const member = interaction.options.getMember("kullanıcı");
      const dakika = interaction.options.getInteger("dakika");

      await member.timeout(dakika * 60 * 1000);

      interaction.reply(`🔇 ${member.user.tag} ${dakika} dakika susturuldu.`);

      if (logChannel)
        logChannel.send(`🔇 ${member.user.tag} ${dakika} dakika susturuldu.`);
    }

    // ================= CLEAR =================
    if (sub === "clear") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

      const sayı = interaction.options.getInteger("sayı");

      const messages = await interaction.channel.bulkDelete(sayı, true);

      interaction.reply({
        content: `🧹 ${messages.size} mesaj silindi.`,
        ephemeral: true
      });
    }

    // ================= WARN =================
    if (sub === "warn") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

      const user = interaction.options.getUser("kullanıcı");
      const reason = interaction.options.getString("sebep");

      const userWarns = warnings.get(user.id) || [];
      userWarns.push(reason);
      warnings.set(user.id, userWarns);

      interaction.reply(`⚠ ${user.tag} uyarıldı.`);

      if (logChannel)
        logChannel.send(`⚠ ${user.tag} uyarıldı | Sebep: ${reason}`);
    }

    // ================= WARNINGS =================
    if (sub === "warnings") {

      const user = interaction.options.getUser("kullanıcı");
      const userWarns = warnings.get(user.id) || [];

      if (userWarns.length === 0)
        return interaction.reply("Bu kullanıcının uyarısı yok.");

      const embed = new EmbedBuilder()
        .setTitle(`${user.tag} Uyarıları`)
        .setDescription(userWarns.map((w, i) => `${i + 1}. ${w}`).join("\n"))
        .setColor("Orange");

      interaction.reply({ embeds: [embed] });
    }

  }
};
