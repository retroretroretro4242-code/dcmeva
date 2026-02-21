require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes
} = require("discord.js");

// ================= CONFIG CHECK =================

const requiredEnv = ["TOKEN", "CLIENT_ID", "GUILD_ID"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ .env eksik: ${key}`);
    process.exit(1);
  }
}

// ================= CLIENT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ================= COMMAND LOADER =================

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if (!command.data || !command.execute) {
      console.warn(`⚠ Komut hatalı: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
  }
}

console.log(`✅ ${client.commands.size} komut yüklendi`);

// ================= SLASH DEPLOY =================

(async () => {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    const slashCommands = client.commands.map(cmd =>
      cmd.data.toJSON()
    );

    console.log("🔄 Slash komutlar yükleniyor...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: slashCommands }
    );

    console.log("✅ Slash komutlar yüklendi");
  } catch (err) {
    console.error("❌ Slash deploy hatası:", err);
  }
})();

// ================= EVENT LOADER =================

const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(...args, client)
      );
    }
  }
}

console.log("✅ Eventler yüklendi");

// ================= READY =================

client.once("ready", () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);
});

// ================= ERROR HANDLING =================

process.on("unhandledRejection", err => {
  console.error("⚠ Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("💥 Uncaught Exception:", err);
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
