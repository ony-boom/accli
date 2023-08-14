import { tweaks } from "@config";
import { cliffy, colors } from "@deps";
import { subDownload, search } from "@api";
import { getChosenSubtitle, showAppName } from "@lib";
import { Subtitle } from "@types";

console.log("\n");
await showAppName();

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
    options: tweaks.language?.list || ["fr", "en"],
    message: "Subtitle language",
    default: tweaks.language?.default || "en",
    pointer: "",
  },
]);

const searchResult = (await search({
  query: queryParams.query!,
  ln: queryParams.ln,
})) as Subtitle[];

if (searchResult.length > 0) {
  const chosenSubtitle = await getChosenSubtitle(searchResult);

  const renameFileTo = await cliffy.Input.prompt({
    message: "Rename downloaded subtitle to ?",
    hint: colors.colors.gray(
      `${colors.colors.italic("%I%")} will be replaced by episode number`
    ),
  });

  const chosenDownload = chosenSubtitle.map(({ fileID, episode }) => {
    let renameTo: string | undefined;

    if (renameFileTo) {
      renameTo = renameFileTo.replace("%I%", episode?.toString() || "");
    }

    return subDownload({ fileId: fileID, path: "./", renameTo });
  });

  await Promise.allSettled(chosenDownload).then(() => Deno.exit());
}
