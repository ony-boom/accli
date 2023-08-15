import { cliffy } from "@deps";
import { tweaks } from "@config";

export const animePrompt = async () => {
  return await cliffy.prompt([
    {
      type: cliffy.Input,
      name: "query",
      message: "Anime name",
      validate(value) {
        return Boolean(value);
      },
    },

    {
      name: "ln",
      type: cliffy.Select,
      options: tweaks.language?.list || ["fr", "en"],
      message: "Subtitle language",
      default: tweaks.language?.default || "en",
      pointer: "",
    },
  ]);
};
