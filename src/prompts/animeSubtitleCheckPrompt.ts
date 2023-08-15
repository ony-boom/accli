import { Subtitle } from "@types";
import { ansi, cliffy } from "@deps";

export const animeSubtitleCheckPrompt = async (data: Subtitle[]) => {
  const options = data.toSorted(sortSubtitle).map(makeSubSelectionPrompt);

  const chosenSubtitle = await cliffy.Checkbox.prompt({
    info: true,
    options,
    uncheck: "󰄰",
    maxOptions: 25, // due to open subtitle
    check: ansi.colors.green("󰄯"),
    message: "Choose which subtitle to download",
    hint: `Press ${ansi.colors.blue("<space> 󱁐")} to select subtitle`,
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
    }${ansi.colors.yellow(episodeTitle)}`,
  };
};

const sortSubtitle = (a: Subtitle, b: Subtitle) => {
  return (
    a.attributes.feature_details.season_number
      ?.toString()
      .localeCompare(b.attributes.feature_details.season_number?.toString()) ||
    a.attributes.feature_details.episode_number -
      b.attributes.feature_details.episode_number
  );
};
