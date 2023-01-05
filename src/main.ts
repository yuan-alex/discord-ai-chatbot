import * as dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  ButtonStyle,
  APIEmbed,
  EmbedBuilder,
} from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import config from "./config";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (commandName === "gpt-3") {
    if (!config.whitelist.includes(interaction.user.id)) {
      await interaction.reply(
        "You do not have permissions to use this command."
      );
      return;
    }

    const prompt = interaction.options.get("prompt").value.toString();
    const model = interaction.options.get("model").value.toString();

    const openaiConfig = new Configuration({
      apiKey: config.openai.apiKey,
    });
    const openai = new OpenAIApi(openaiConfig);

    await interaction.deferReply();

    const completion = await openai.createCompletion({
      model: model,
      prompt,
      max_tokens: 64,
    });

    const result = completion.data.choices[0].text;

    const embed = new EmbedBuilder().addFields(
      { name: interaction.user.username, value: prompt },
      { name: model, value: result }
    );

    await interaction.editReply({
      embeds: [embed],
    });
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(config.discord.botToken);
