import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { join, os, z } from "./deps.ts";

const envSchema = z.object({
  ACCLI_API_KEY: z.string(),
  ACCLI_USERNAME: z.string(),
  ACCLI_PASSWORD: z.string(),
  ACCLI_TOKEN_STORAGE_FILE_PATH: z.string(),
});

export const env = envSchema.parse(Deno.env.toObject());

export let tokenFilePath =
  env.ACCLI_TOKEN_STORAGE_FILE_PATH || "~/.accli_token.txt";

if (os.homeDir()) {
  tokenFilePath = tokenFilePath.replace("~/", "");
  tokenFilePath = join(os.homeDir()!, tokenFilePath);
}

