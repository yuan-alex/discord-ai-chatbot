import "dotenv/config";

import { commands } from "./commands.js";

const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`;

// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
fetch(url, {
  method: "PUT",
  body: JSON.stringify(commands),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  },
})
  .then((res) => res.json())
  .then((data) =>
    console.log(
      `✨ Successfully registered application commands.\n\n${JSON.stringify(data)}`,
    ),
  )
  .catch(console.error);
