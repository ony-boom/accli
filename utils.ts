import { cliffy, colors, join, walk } from "./deps.ts";
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

export const outputResult = async (data: Datum[]) => {
  const chosenSubtitle = await cliffy.Checkbox.prompt({
    message: "Choose which subtitle to download",
    options: data
      .toSorted(
        (a, b) =>
          a.attributes.feature_details.season_number
            ?.toString()
            .localeCompare(
              b.attributes.feature_details.season_number?.toString()
            ) ||
          a.attributes.feature_details.episode_number -
            b.attributes.feature_details.episode_number
      )
      .map((subtitle) => {
        const fileID = subtitle.attributes.files[0].file_id;
        const mainTitle = subtitle.attributes.feature_details.parent_title;
        const episode = subtitle.attributes.feature_details.episode_number;
        const episodeTitle = subtitle.attributes.feature_details.title;
        const season = subtitle.attributes.feature_details.season_number;

        return {
          value: { fileID, episode },
          episode,
          name: `${mainTitle ? `${mainTitle} : ` : ""}${
            season
              ? "S" +
                season.toLocaleString("en-US", {
                  minimumIntegerDigits: 2,
                }) +
                "-"
              : ""
          }${
            episode
              ? "E" +
                episode.toLocaleString("en-US", { minimumIntegerDigits: 2 }) +
                " "
              : ""
          }${colors.colors.gray(episodeTitle)}`,
        };
      }),
    check: colors.colors.green("󰄯"),
    uncheck: "󰄰",
    hint: `Press ${colors.colors.blue("<space> 󱁐")} to select subtitle`,
    info: true,
  });
  return chosenSubtitle as unknown as { episode: number; fileID: number }[];
};
