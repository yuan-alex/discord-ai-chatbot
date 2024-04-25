import { SlashCommandBuilder } from "discord.js";

export const commands = [
	new SlashCommandBuilder().setName("ping").setDescription("pong"),
	new SlashCommandBuilder()
		.setName("chatgpt")
		.setDescription("ChatGPT toolkit")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("start")
				.setDescription("Start thread with ChatGPT powered by ChatGPT"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("complete")
				.setDescription("Complete a prompt")
				.addStringOption((option) =>
					option
						.setName("prompt")
						.setDescription("Prompt for ChatGPT")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("model")
						.setDescription(
							"Each language model has different capabilities and price points",
						)
						.addChoices({
							name: "GPT-3.5 (fastest)",
							value: "gpt-3.5-turbo",
						})
						.addChoices({
							name: "GPT-4 (most capable)",
							value: "gpt-4-turbo",
						})
						.setRequired(true),
				),
		),
].map((command) => command.toJSON());
