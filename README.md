# GPT Discord Bot

An example of a Discord bot powered by the OpenAI API.

## Setup

1. Create a Discord bot and invite it to your server.
2. Create a `.env` file in the root directory of the project or set up the proper environment variables on your
   deployment environment. Use the `.env.example` file as a template.
3. Run `pnpm deploy-commands` to register your bot commands.
4. Run `pnpm dev` to start the bot.

## Commands

- `/gpt-3 complete` - Generate text using the GPT-3 API.
- `/gpt-3 chat` - Starts a chat thread with GPT-3.
- `/ping` - Responds with a GPT-3 generated poem.
