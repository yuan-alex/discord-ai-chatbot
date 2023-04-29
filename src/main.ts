import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import * as openai from "openai";
import config from "./config.js";

const openaiConfig = new openai.Configuration({
  apiKey: config.openai.apiKey,
});
const openaiAPI = new openai.OpenAIApi(openaiConfig);

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
      let prompt = `You are ChatGPT, a large language model trained by OpenAI. You are also a Discord bot. Answer as concisely as possible. Each answer should be 200 characters or less. Answer in the style of a Discord user. Don't use formal language. Current date: ${new Date().toLocaleString()}.`;

      // get the last 10 messages from the thread
      let discordMessages = await message.channel.messages.fetch({
        limit: 10,
      });
      discordMessages.reverse();

      const messages = [
        {
          role: openai.ChatCompletionRequestMessageRoleEnum.System,
          content: prompt,
        },
        ...discordMessages
          .filter((message) => {
            return (
              message.author.id === config.discord.clientId ||
              config.whitelist.includes(message.author.id)
            );
          })
          .map((message) => {
            if (message.author.id === config.discord.clientId) {
              return {
                role: openai.ChatCompletionRequestMessageRoleEnum.System,
                content: message.content,
              };
            } else {
              return {
                role: openai.ChatCompletionRequestMessageRoleEnum.User,
                content: message.content,
                name: message.author.username,
              };
            }
          }),
      ];

      const response = await openaiAPI.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });
      const result = response.data.choices[0].message.content;

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

    const completion = await openaiAPI.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Write a very short poem about getting pinged in Discord.",
        },
      ],
      max_tokens: 50,
    });
    const result = completion.data.choices[0].message.content;

    await interaction.editReply({
      content: result,
    });
  } else if (interaction.commandName === "chatgpt") {
    if (interaction.options.getSubcommand() === "start") {
      if (!config.whitelist.includes(interaction.user.id)) {
        await interaction.reply(
          "You do not have permissions to use this command."
        );
        return;
      }

      const channel = interaction.channel as TextChannel;

      // create a new thread in response to the interaction
      const thread = await channel.threads.create({
        name: "ChatGPT",
        autoArchiveDuration: 60,
      });

      await interaction.reply({
        content: `I've created a new thread for you. We can talk in there.`,
        ephemeral: true,
      });

      await thread.send({
        content:
          "What's up? I'm ChatGPT, a large language model trained by OpenAI. Please be aware that messages in this thread may be sent to OpenAI for processing.",
      });
    }
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

      const completion = await openaiAPI.createCompletion({
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
          name: "Davinci (largest)",
          value: "text-davinci-003",
          inline: true,
        }
      );
      await interaction.reply({
        embeds: [embed],
      });
    }
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(config.discord.botToken);
