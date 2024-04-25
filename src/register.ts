import { commands } from "./commands.js";

const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`;

fetch(url, {
  method: "POST",
  body: JSON.stringify(commands),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  },
})
  .then((res) => res.json())
  .then(() => console.log("✨ Successfully registered application commands."))
  .catch(console.error);
