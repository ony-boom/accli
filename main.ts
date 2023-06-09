import { auth, search, download } from "./api.ts";
import { parse } from "./deps.ts";
import { isValidCommand } from "./types.ts";

const flags = parse(Deno.args, {
  boolean: ["help", "aS"],
  string: ["path", "ln", "episode", "season", "page", "fileId", "renameTo"],
});

const commandLike = flags._[0];

if (isValidCommand(commandLike)) {
  switch (commandLike) {
    case "auth":
      await auth();
      break;

    // deno-lint-ignore no-case-declarations
    case "search":
      const query = flags._[1];
      if (!query) {
        throw new Error("Please give the anime name to search");
      }
      await search({
        query: String(query),
        ln: flags.ln,
        episode: Number(flags.episode),
        season: Number(flags.season),
        page: Number(flags.page),
      });
      break;

    // deno-lint-ignore no-case-declarations
    case "download":
      const fileId = flags.fileId;
      const searchQuery = flags._[1];

      if (!searchQuery && !fileId) {
        throw new Error("Please give the anime name to download or the fileID");
      }

      await download({
        downloadParams: {
          path: flags.path!,
          fileId: Number(fileId),
          renameTo: flags.renameTo,
          downloadAllSeason: flags.aS,
        },
        queryParams: {
          query: String(searchQuery),
          ln: flags.ln,
          episode: Number(flags.episode),
          season: Number(flags.season),
          page: Number(flags.page),
        },
      });

      break;

    default:
      console.log("To lazy to implement this XD");
      break;
  }
}
