import { join, walk } from "./deps.ts";
import { Datum } from "./types.ts";

const TEMP_DIR = ".temp_sub_dir";

const getExtension = (file: string) => file.slice(file.lastIndexOf(".") + 1);

export const saveFile = async (
  path: string,
  content: string,
  oldName: string,
  renameTo?: string
) => {
  const extension = getExtension(oldName);

  const fileName = renameTo ? `${renameTo}.${extension}` : oldName;

  const filePath = join(path, fileName);

  await Deno.writeTextFile(filePath, content, { create: true });

  return filePath;
};

export const getUserChosenSubtitle = (
  searchResult: Datum[],
  isASeasonDownload: boolean
) => {
  const message = isASeasonDownload
    ? "Please select the subtitle, season related to this subtitle will be downloaded"
    : "Which subtitle to download ? :";

  const chosenSubtitleIndex = prompt(`\n${message}`, "1");

  return searchResult[Number(chosenSubtitleIndex) - 1].attributes;
};

export const decompressZipped = async (zipPath: string) => {
  console.log("Extracting zip... ⌛");

  const command = new Deno.Command("unzip", {
    args: [zipPath, "-d", TEMP_DIR],
  });

  const { success, stderr } = await command.output();

  if (!success) {
    console.log(
      "Something went wrong when extracting the zip file \n. Do you have unzip on you'r system ?",
      new TextDecoder().decode(stderr)
    );
  }

  await Deno.remove(zipPath);
};

export const processSubtitleFiles = async (renameString?: string) => {
  console.log("Processing Subtitle...⌛");

  const parentDirPath = await Deno.realPath("./");
  const tempSubDirEntries = walk(TEMP_DIR);

  let episodeNumber = "";

  for await (const entry of tempSubDirEntries) {
    if (entry.isDirectory) {
      const dirnameNumber = entry.name.match(/[0-9]/g)?.join("");
      if (dirnameNumber) {
        episodeNumber =
          dirnameNumber.length > 1 ? dirnameNumber : `0${dirnameNumber}`;
      }
    }

    if (entry.isFile) {
      const renameStringIndexed = renameString?.replace("%I%", episodeNumber);
      const extension = getExtension(entry.path);
      const newFileName = renameStringIndexed
        ? `${renameStringIndexed}.${extension}`
        : entry.name;

      const newFilePath = join(parentDirPath, newFileName);

      await Deno.rename(entry.path, newFilePath);
    }
  }

  await Deno.remove(TEMP_DIR, { recursive: true });
};
