import "dotenv/config";

import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    if (
      !process.env.DISCORD_USER_ID_WHITELIST.split(",").includes(
        message.author.id
      )
    ) {
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
      initialMessage.author.id === process.env.DISCORD_CLIENT_ID
    ) {
      await message.channel.sendTyping();

      // this thread was created by the bot, so we can handle it
      const systemPrompt = `You are ChatGPT, a large language model trained by OpenAI. You are also a Discord bot. Answer as concisely as possible. Each answer should be 200 characters or less. Answer in the style of a Discord user. Current date: ${new Date().toLocaleString()}.`;

      // get the last 10 messages from the thread
      let discordMessages = await message.channel.messages.fetch({
        limit: 10,
      });
      discordMessages.reverse();

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...discordMessages
          .filter((message) => {
            return (
              message.author.id === process.env.DISCORD_CLIENT_ID ||
              process.env.DISCORD_USER_ID_WHITELIST.split(",").includes(
                message.author.id
              )
            );
          })
          .map((message) => {
            if (message.author.id === process.env.DISCORD_CLIENT_ID) {
              return {
                role: "system",
                content: message.content,
              };
            } else {
              return {
                role: "user",
                content: message.content,
                name: message.author.username,
              };
            }
          }),
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages,
      });
      const result = response.choices[0].message.content;

      await message.channel.send({
        content: result,
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    interaction.editReply({
      content: "pong!",
    });
  } else if (interaction.commandName === "chat") {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "start") {
      if (
        !process.env.DISCORD_USER_ID_WHITELIST.split(",").includes(
          interaction.user.id
        )
      ) {
        await interaction.reply(
          "You do not have permissions to use this command."
        );
        return;
      }

      const channel = interaction.channel as TextChannel;

      // create discord thread
      const thread = await channel.threads.create({
        name: "ChatGPT Thread",
        autoArchiveDuration: 60,
      });

      await interaction.reply({
        content: `I've created a new thread for us. Let's can talk in there.`,
        ephemeral: true,
      });

      await thread.send({
        content:
          "I'm ChatGPT, a large language model trained by OpenAI. *Please be aware that messages in this thread may be sent to OpenAI for processing*.",
      });
    } else if (subcommand === "complete") {
      if (
        !process.env.DISCORD_USER_ID_WHITELIST.split(",").includes(
          interaction.user.id
        )
      ) {
        await interaction.reply(
          "You do not have permissions to use this command."
        );
        return;
      }

      const prompt = interaction.options.get("prompt").value.toString();
      const model = interaction.options.get("model").value.toString();

      await interaction.deferReply();

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are ChatGPT, a large language model trained by OpenAI.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 256,
      });

      const result = completion.choices[0].message.content;

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
    }
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
