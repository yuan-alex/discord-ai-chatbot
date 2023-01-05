import "dotenv/config";

const config = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    botToken: process.env.DISCORD_BOT_TOKEN,
  },
  whitelist: process.env.DISCORD_USER_ID_WHITELIST.split(","),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
};

if (!config.discord.clientId) {
  throw new Error("DISCORD_CLIENT_ID is not defined");
}

if (!config.discord.guildId) {
  throw new Error("DISCORD_GUILD_ID is not defined");
}

if (!config.discord.botToken) {
  throw new Error("DISCORD_BOT_TOKEN is not defined");
}

if (!config.openai.apiKey) {
  throw new Error("OPENAI_API_KEY is not defined");
}

export default config;
