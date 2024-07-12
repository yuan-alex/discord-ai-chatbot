import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("pong"),
  new SlashCommandBuilder()
    .setName("chatbot")
    .setDescription("Chatbot utils")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Starts a new thread with the chatbot"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("message")
        .setDescription("Send a single message to the chatbot")
        .addStringOption((option) =>
          option
            .setName("content")
            .setDescription("Message content")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("model")
            .setDescription("LLM model")
            .setRequired(false),
        ),
    ),
].map((command) => command.toJSON());
