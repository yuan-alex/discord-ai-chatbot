import {
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  type TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import OpenAI from "openai";

import { env } from "./env";

const modelConfig = {
  name: env.OPENAI_MODEL || "gpt-3.5-turbo",
  systemPrompt: `You are a Discord bot. Do not use too many emojis. Always ensure replies promote positive values. It is currently ${new Date().toLocaleString()}.`,
};

const MESSAGE_CONTEXT_LENGTH = 10;

const openai = new OpenAI();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

function checkUserIdWhitelist(userId: string) {
  return (
    userId === env.DISCORD_CLIENT_ID ||
    !env.DISCORD_USER_ID_WHITELIST ||
    env.DISCORD_USER_ID_WHITELIST?.split(",").includes(userId)
  );
}

client.on(Events.MessageCreate, async (message) => {
  if (
    !message.author ||
    !checkUserIdWhitelist(message.author.id) ||
    (message.channel.isThread() &&
      message.channel.ownerId !== env.DISCORD_CLIENT_ID) ||
    (!message.channel.isThread() && message.channel.type !== ChannelType.DM)
  ) {
    return;
  }

  message.channel.sendTyping();

  // for now the context is the last 10 messages in the thread
  const discordMessages = await message.channel.messages.fetch({
    limit: MESSAGE_CONTEXT_LENGTH,
  });
  discordMessages.reverse();

  const messages = [
    {
      role: "system",
      content: modelConfig.systemPrompt,
    },
    ...discordMessages
      .filter((message) => checkUserIdWhitelist(message.author.id))
      .map((message) =>
        message.author.id === env.DISCORD_CLIENT_ID
          ? {
              role: "assistant",
              content: message.content,
            }
          : {
              role: "user",
              content: message.content,
              name: message.author.username,
            },
      ),
  ];

  const response = await openai.chat.completions.create({
    model: modelConfig.name,
    messages,
  });
  const result = response.choices[0].message.content;

  await message.channel.send({
    content: result,
  });
});

client.on("interactionCreate", async (interaction) => {
  if (
    !interaction.isChatInputCommand() ||
    !checkUserIdWhitelist(interaction.user.id)
  ) {
    return;
  }

  if (interaction.commandName === "ping") {
    const completion = await openai.chat.completions.create({
      model: modelConfig.name,
      messages: [
        {
          role: "user",
          content: "Write a short poem about getting pinged in Discord.",
        },
      ],
    });

    interaction.reply({
      content: completion.choices[0].message.content,
    });
  } else if (interaction.commandName === "chatbot") {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "start") {
      const channel = interaction.channel as TextChannel;

      // create discord thread
      const thread = await channel.threads.create({
        name: "AI Chatbot Thread",
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      });

      await interaction.reply({
        content: `I've created a new thread for us. Let's can talk in there.`,
        ephemeral: true,
      });

      await thread.send({
        content: "Hello, how can I help you today?",
      });
    } else if (subcommand === "message") {
      if (!checkUserIdWhitelist(interaction.user.id)) {
        await interaction.reply(
          "You do not have permissions to use this command.",
        );
        return;
      }

      const prompt = interaction.options.get("content").value.toString();
      const model =
        interaction.options.get("model")?.value.toString() || modelConfig.name;

      await interaction.deferReply();

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: modelConfig.systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 256,
      });

      const result = completion.choices[0].message.content;

      const embed = new EmbedBuilder().addFields(
        { name: interaction.user.username, value: prompt },
        { name: model, value: result },
      );

      await interaction.editReply({
        embeds: [embed],
      });
    }
  }
});

client.once("ready", (c) => {
  console.log(`✨ Ready! Logged in as ${c.user.tag}`);
});

client.login(env.DISCORD_BOT_TOKEN);
