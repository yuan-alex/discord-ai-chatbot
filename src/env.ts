import "dotenv/config";

import { z } from "zod";

const EnvSchema = z.object({
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_USER_ID_WHITELIST: z.string(),
  OPENAI_API_KEY: z.string(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof EnvSchema> {}
  }
}
