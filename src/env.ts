import { z } from "zod";

const envVariables = z.object({
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_GUILD_ID: z.string(),
  DISCORD_USER_ID_WHITELIST_ENABLED: z.boolean(),
  DISCORD_USER_ID_WHITELIST: z.string(),
  OPENAI_API_KEY: z.string(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
