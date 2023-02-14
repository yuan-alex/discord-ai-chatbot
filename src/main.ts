import {
  APIEmbed,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageInteraction,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import config from "./config.js";

const openaiConfig = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(openaiConfig);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.MessageCreate, async (message) => {
  // check if the interaction is a response to a thread we created and is human
  if (!message.author.bot && message.channel.isThread()) {
    if (!config.whitelist.includes(message.author.id)) {
      return;
    }

    // check if the thread was created by the bot
    let messages = await message.channel.messages.fetch({
      limit: 100,
    });
    messages.reverse();

    const initialMessage = messages.first();
    if (
      initialMessage.author.bot &&
      initialMessage.author.id === config.discord.clientId
    ) {
      await message.channel.sendTyping();

      // this thread was created by the bot, so we can handle it
      let prompt =
        "The following is a Discord chat with a Discord GPT-3 bot. The bot is helpful, clever, and very concise. It responds in the style of a Discord user.\n\nHuman: Hello, who are you?\n";

      // get the last 10 messages from the thread
      let messages = await message.channel.messages.fetch({
        limit: 10,
      });
      messages.reverse();

      messages
        .filter((message) => {
          return (
            message.author.id === config.discord.clientId ||
            config.whitelist.includes(message.author.id)
          );
        })
        .forEach((message) => {
          if (message.author.id === config.discord.clientId) {
            prompt += "AI: ";
          } else {
            prompt += `${message.author.username}: `;
          }
          prompt += message.content + "\n";
        });
      prompt += "AI:";

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
      });
      const result = response.data.choices[0].text.slice(1);

      await message.channel.send({
        content: result,
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
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
  } else if (interaction.commandName === "gpt-3") {
    if (interaction.options.getSubcommand() === "complete") {
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
        });

      await interaction.editReply({
        embeds: [embed],
      });
    } else if (interaction.options.getSubcommand() === "models") {
      const embed = new EmbedBuilder()
        .setTitle("GPT-3 Models")
        .setDescription(
          "Here are the models you can use with the `/gpt-3 prompt` command."
        )
        .setFooter({
          text: "Powered by OpenAI",
        });
      embed.addFields(
        {
          name: "Ada (fastest)",
          value: "text-ada-001",
          inline: true,
        },
        {
          name: "Babbage (fast)",
          value: "text-babbage-001",
          inline: true,
        },
        {
          name: "Curie (medium)",
          value: "text-curie-001",
          inline: true,
        },
        {
          name: "Davinci (slow)",
          value: "text-davinci-001",
          inline: true,
        }
      );
      await interaction.reply({
        embeds: [embed],
      });
    } else if (interaction.options.getSubcommand() === "chat") {
      if (!config.whitelist.includes(interaction.user.id)) {
        await interaction.reply(
          "You do not have permissions to use this command."
        );
        return;
      }

      const channel = interaction.channel as TextChannel;

      // create a new thread in response to the interaction
      const thread = await channel.threads.create({
        name: "GPT-3 Chat",
        autoArchiveDuration: 60,
        reason: "GPT-3 Chat Thread",
      });

      await thread.send({
        content: "Hello, I'm a Discord bot powered by GPT-3.",
      });

      await interaction.reply({
        content: `Created thread: ${thread.name}`,
        ephemeral: true,
      });
    }
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(config.discord.botToken);
