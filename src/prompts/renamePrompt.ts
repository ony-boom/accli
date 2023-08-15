import { ansi, cliffy } from "@deps";

export const renamePrompt = async () => {
  return await cliffy.Input.prompt({
    message: "Rename downloaded subtitle to ?",
    hint: ansi.colors.gray(
      `${ansi.colors.italic("%I%")} will be replaced by episode number`
    ),
  });
};
