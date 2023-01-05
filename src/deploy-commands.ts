import { SlashCommandBuilder, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import config from "./config";

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("pong"),
  new SlashCommandBuilder()
    .setName("gpt-3")
    .setDescription("GPT-3 toolkit")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("chat")
        .setDescription("Start thread with GPT-3")
        .addStringOption((option) =>
          option
            .setName("prompt")
            .setDescription("Prompt for GPT-3")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("complete")
        .setDescription("Completes a prompt")
        .addStringOption((option) =>
          option
            .setName("prompt")
            .setDescription("Prompt for GPT-3")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("model")
            .setDescription(
              "Each language model has different capabilities and price points"
            )
            .addChoices({ name: "Ada (fastest)", value: "text-ada-001" })
            .addChoices({ name: "Babbage", value: "text-babbage-001" })
            .addChoices({ name: "Curie", value: "text-curie-001" })
            .addChoices({
              name: "Davinci (most powerful)",
              value: "text-davinci-003",
            })
            .setRequired(true)
        )
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(config.discord.botToken);

rest
  .put(
    Routes.applicationGuildCommands(
      config.discord.clientId,
      config.discord.guildId
    ),
    {
      body: commands,
    }
  )
  .then(() => console.log("✨ Successfully registered application commands."))
  .catch(console.error);
