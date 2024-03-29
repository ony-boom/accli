import { join, os } from "@deps";
import { config } from "./config.ts";

export let tokenFilePath =
  config.tokenPath || join(".config", "accli", "token.txt");

if (os.homeDir()) {
  tokenFilePath = tokenFilePath.replace("~/", "");
  tokenFilePath = join(os.homeDir()!, tokenFilePath);
}
