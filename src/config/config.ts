import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { join, os, z, parse } from "@deps";

export { DEFAULT_APP_NAME } from "./constant.ts";

const decoder = new TextDecoder("utf-8");

const configPath = join(os.homeDir() || "~/", "accli.toml");
const configFile = Deno.readFileSync(configPath);

const configSchema = z.object({
  config: z.object({
    apiKey: z.string(),
    username: z.string(),
    password: z.string(),
    tokenPath: z.string(),
  }),
  tweaks: z.object({
    appName: z.optional(z.string()),
    showAppName: z.optional(z.boolean()),
    language: z.optional(
      z.object({
        list: z.array(z.string()),
        default: z.string(),
      })
    ),
  }),
});

export const { config, tweaks } = configSchema.parse(
  parse(decoder.decode(configFile))
);
