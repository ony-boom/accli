import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { join, os, z, parse, existsSync, ansi } from "@deps";

export { DEFAULT_APP_NAME } from "./constant.ts";

const decoder = new TextDecoder("utf-8");

const configPath = join(os.homeDir() || "~/", ".config", "accli", "accli.toml");

if (!existsSync(configPath)) {
  console.log(
    ansi.colors.red(
      "Config file not found, please start by creating a new one at:\n"
    ),
    ansi.colors.underline.blue(configPath)
  );
  Deno.exit(1);
}

const configFile = Deno.readFileSync(configPath);

const configSchema = z.object({
  config: z.object({
    apiKey: z.string(),
    username: z.string(),
    password: z.string(),
    tokenPath: z.optional(
      z
        .string()
        .default(join(os.homeDir() || "~/", ".config", "accli", "token.txt"))
    ),
  }),
  tweaks: z.object({
    appName: z.optional(z.string()),
    showAppName: z.optional(z.boolean()),
    asciiFont: z.optional(z.string()),
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
