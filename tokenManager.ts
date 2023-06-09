import { existsSync } from "https://deno.land/std@0.190.0/fs/mod.ts";
import { tokenFilePath } from "./config.ts";

export const setAuthToken = async (token: string) => {
  try {
    await Deno.writeTextFile(tokenFilePath, token, { create: true });

    console.log(
      "Token saved, you may don't need to login again while the token is still valid\n",
      "The cli will automatically authenticate you anyway"
    );
  } catch (error) {
    console.error(
      "Can't write token to file system, did you allow the access 🤷 ?",
      "The reason:\n",
      error
    );
    Deno.exit(0);
  }
};

export const getToken = async () => {
  return await Deno.readTextFile(tokenFilePath);
};

export const hasToken = () => existsSync(tokenFilePath);
