import { tweaks } from "@config";
import { gradient } from "@deps";
import { getAppNameArt } from "@api";

import { cliffy, colors, join } from "@deps";
import { Subtitle, ToshoResult } from "@types";

export const getExtension = (file: string) => file.slice(file.lastIndexOf(".") + 1);

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

export const getChosenSubtitle = async (data: Subtitle[]) => {
  const options = data
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
    .map(makeSubSelectionPrompt);

  const chosenSubtitle = await cliffy.Checkbox.prompt({
    info: true,
    options,
    uncheck: "󰄰",
    maxOptions: 25, // due to open subtitle
    check: colors.colors.green("󰄯"),
    message: "Choose which subtitle to download",
    hint: `Press ${colors.colors.blue("<space> 󱁐")} to select subtitle`,
  });

  return chosenSubtitle as unknown as { episode?: number; fileID: number }[];
};

const makeSubSelectionPrompt = (subtitle: Subtitle) => {
  const fileID = subtitle.attributes.files[0].file_id;
  const mainTitle = subtitle.attributes.feature_details.parent_title;
  const episode = subtitle.attributes.feature_details.episode_number;
  const episodeTitle = subtitle.attributes.feature_details.title;
  const season = subtitle.attributes.feature_details.season_number;

  return {
    value: { fileID, episode },
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
    }${colors.colors.yellow(episodeTitle)}`,
  };
};

export const getChosenToshoAttachments = async (
  toshoResults: ToshoResult[]
) => {
  const options = toshoResults.map((option) => ({
    value: { animeId: option.id, title: option.title },
    name: option.title,
  }));

  const chosenAttachments = await cliffy.Select.prompt({
    options,
    message: "Get attachments from ?",
    search: true
  });

  return chosenAttachments as unknown as { animeId: number; title: string };
};

export const showAppName = async () => {
  if (tweaks.showAppName) {
    const appName = gradient.pastel(await getAppNameArt());
    console.log(appName);
  }
};
