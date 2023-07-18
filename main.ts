import { download, search } from "./api.ts";
import { APP_NAME } from "./constant.ts";
import { cliffy, colors } from "./deps.ts";
import { outputResult } from "./utils.ts";

console.log(APP_NAME);
console.log("\n");

const queryParams = await cliffy.prompt([
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
    options: ["fr", "en"],
    message: "Subtitle language",
    default: "en",
    pointer: "",
  },
]);

const searchResult = await search({
  query: queryParams.query!,
  ln: queryParams.ln,
});

if (searchResult.length > 0) {
  const chosenSubtitle = await outputResult(searchResult);

  const renameFileTo = await cliffy.Input.prompt({
    message: "Rename downloaded subtitle to ?",
    hint: colors.colors.gray(
      `${colors.colors.italic("%I%")} will be replaced by episode number`
    ),
  });

  const chosenDownload = chosenSubtitle.map(({ fileID, episode }) => {
    let renameTo: string | undefined;

    if (renameFileTo) {
      renameTo = renameFileTo.replace("%I%", episode.toString());
    }

    return download({ fileId: fileID, path: "./", renameTo });
  });

  await Promise.allSettled(chosenDownload).then(() => Deno.exit());
}
