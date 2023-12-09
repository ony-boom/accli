import { tokenFilePath } from "@config";
import { existsSync } from "@deps";
import { auth } from "./auth.ts";

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
  if (!hasToken()) {
    await auth();
  }
  return await Deno.readTextFile(tokenFilePath);
};

export const hasToken = () => existsSync(tokenFilePath);
