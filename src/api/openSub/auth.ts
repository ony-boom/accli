import { AuthPostData, AuthResponse } from "@types";
import { config } from "@config";
import { client } from "../client.ts";
import { setAuthToken } from "./token.ts";

export const auth = async () => {
  const authData: AuthPostData = {
    password: config.password,
    username: config.username,
  };

  try {
    const { data: authResponse } = await client.post<AuthResponse>(
      "/login",
      authData
    );


    await setAuthToken(authResponse.token);

    console.log("Authenticated ✅");
  } catch (error) {
    console.error(
      "Authentication error 💥 \n",

      "It's seems that something went wrong, may be you are offline",
      "The reason:\n",
      error
    );

    Deno.exit(0);
  }
};
