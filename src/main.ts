import { subDownload, openSubSearch } from "@api";
import { showAppName } from "@lib";
import { Subtitle } from "@types";
import { animePrompt, animeSubtitleCheckPrompt, renamePrompt } from "@prompts";

console.log("\n");
await showAppName();

const queryParams = await animePrompt();

const searchResult = (await openSubSearch({
  query: queryParams.query!,
  ln: queryParams.ln,
})) satisfies Subtitle[];

if (searchResult.length > 0) {
  const subtitles = await animeSubtitleCheckPrompt(searchResult);
  const renameFileTo = await renamePrompt();

  const chosenDownload = subtitles.map(({ fileID, episode }) => {
    let renameTo: string | undefined;

    if (renameFileTo) {
      renameTo = renameFileTo.replace("%I%", episode?.toString() || "");
    }

    return subDownload({ fileId: fileID, path: "./", renameTo });
  });

  await Promise.allSettled(chosenDownload).then(() => Deno.exit());
}
