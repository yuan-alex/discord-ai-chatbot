import {
  APIEmbed,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import config from "./config";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  const openaiConfig = new Configuration({
    apiKey: config.openai.apiKey,
  });
  const openai = new OpenAIApi(openaiConfig);

  if (commandName === "ping") {
    await interaction.deferReply();

    const completion = await openai.createCompletion({
      model: "text-curie-001",
      prompt: "Write a very short poem about getting pinged in Discord.",
      max_tokens: 50,
    });
    const result = completion.data.choices[0].text;

    await interaction.editReply({
      content: result,
    });
  } else if (commandName === "gpt-3") {
    if (!config.whitelist.includes(interaction.user.id)) {
      await interaction.reply(
        "You do not have permissions to use this command."
      );
      return;
    }

    const prompt = interaction.options.get("prompt").value.toString();
    const model = interaction.options.get("model").value.toString();

    await interaction.deferReply();

    const completion = await openai.createCompletion({
      model: model,
      prompt,
      max_tokens: 256,
    });

    const result = completion.data.choices[0].text;

    const embed = new EmbedBuilder()
      .addFields(
        { name: interaction.user.username, value: prompt },
        { name: model, value: result }
      )
      .setFooter({
        text: "Powered by OpenAI",
        iconURL: "https://openai.com/content/images/2022/05/openai-avatar.png",
      });

    await interaction.editReply({
      embeds: [embed],
    });
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(config.discord.botToken);
