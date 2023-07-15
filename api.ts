import { setAuthToken, getToken } from "./tokenManager.ts";
import {
  AuthPostData,
  AuthResponse,
  DownloadParams,
  DownloadResponse,
  Range,
  SearchData,
  SearchParams,
  isRange,
} from "./types.ts";
import { env } from "./config.ts";
import { axiod, join } from "./deps.ts";
import {
  decompressZipped,
  getUserChosenSubtitle,
  processSubtitleFiles,
  saveFile,
} from "./utils.ts";
import { _format } from "https://deno.land/std@0.190.0/path/_util.ts";

const client = axiod.create({
  baseURL: "https://api.opensubtitles.com/api/v1",
  headers: {
    "Api-Key": env.ACCLI_API_KEY,
  },
});

const getSeasonDownloadLink = (imDbId: number) =>
  `https://www.opensubtitles.org/download/s/sublanguageid-fre/pimdbid-${imDbId}/season-1`;

export const auth = async () => {
  const authData: AuthPostData = {
    password: env.ACCLI_PASSWORD,
    username: env.ACCLI_USERNAME,
  };

  try {
    const { data: authResponse } = await client.post<AuthResponse>(
      "/login",
      authData
    );

    await setAuthToken(authResponse.token);

    console.log("Authenticated ✅");
  } catch (error) {
    console.error(
      "Authentication error 💥 \n",
      "It's seems that something went wrong, may be you are offline",
      "The reason:\n",
      error
    );

    Deno.exit(0);
  }
};

export const search = async ({
  query,
  ln = "en",
  episode,
  season,
  page,
}: SearchParams) => {
  const extraParamList = [
    { episode_number: episode },
    { season_number: season },
    { page },
  ];

  const queryParams: Record<string, string | number> = {};

  for (const param of extraParamList) {
    for (const key in param) {
      const paramName = key as keyof typeof param;
      if (param[paramName]) {
        queryParams[key] = param[paramName]!;
      }
    }
  }

  const {
    data: { data: searchResult },
  } = await client.get<SearchData>("/subtitles", {
    params: { query, languages: ln, ...queryParams },
  });

  console.log(" \nResult: ");

  if (searchResult.length === 0) {
    console.log("No subtitle for this one 🥲");
    Deno.exit(1);
  }

  for (let i = 0; i < searchResult.length; i++) {
    const result = searchResult[i];
    console.log(`[${i + 1}]:`, result.attributes.feature_details.title);
  }

  return searchResult;
};

export const download = async ({
  queryParams,
  downloadParams: {
    path = "./",
    fileId,
    renameTo,
    downloadAllSeason = false,
    range,
    prompt = true,
  },
}: DownloadParams) => {
  let file_id: number;
  let seasonImDbId = 0;
  let title = "";

  if (isRange(range)) {
    const downloadParamCopy: DownloadParams = {
      downloadParams: { path, fileId, renameTo },
      queryParams,
    };
    rangeDownload(range, downloadParamCopy);
    return;
  }

  if (fileId) {
    file_id = fileId;
  } else {
    const searchResult = await search(queryParams);

    const chosenSubtitle = prompt
      ? getUserChosenSubtitle(searchResult, downloadAllSeason)
      : searchResult[0].attributes;

    title = chosenSubtitle.feature_details.parent_title;

    file_id = chosenSubtitle.files[0].file_id;

    seasonImDbId = downloadAllSeason
      ? chosenSubtitle.feature_details.parent_imdb_id
      : 0;
  }

  try {
    console.log("Downloading... ⌛");
    if (downloadAllSeason) {
      await seasonDownload(seasonImDbId, title, path, renameTo);
    } else {
      await episodeDownload(file_id, path, renameTo);
    }
    console.log("Done ✅");
  } catch (error) {
    console.log(error);
  }
};

const rangeDownload = async (range: Range, downloadParams: DownloadParams) => {
  const [start, end] = range;

  const rangeArray = Array(end - start + 1)
    .fill(1)
    .map((num, index) => {
      const episodeNumber = num * start + index;
      const stringEpisodeNumber = String(episodeNumber).length > 1
        ? String(episodeNumber)
        : `0${episodeNumber}`;

      const updatedDownloadParam: DownloadParams = {
        downloadParams: {
          ...downloadParams.downloadParams,
          renameTo: downloadParams.downloadParams.renameTo?.replace(
            "%I%",
            stringEpisodeNumber,
          ),
          prompt: false,
        },
        queryParams: {
          ...downloadParams.queryParams,
          episode: episodeNumber,
        },
      };
      return download(updatedDownloadParam);
    });

  return await Promise.allSettled(rangeArray);
};

const getSubtitleDownloadInfo = async (file_id: number, token: string) => {
  const { data } = await client.post<DownloadResponse>(
    "/download",
    {
      file_id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Api-Key": env.ACCLI_API_KEY,
      },
    },
  );

  return data;
};

const episodeDownload = async (
  file_id: number,
  path: string,
  renameTo?: string,
) => {
  const token = await getToken();
  const { link, file_name } = await getSubtitleDownloadInfo(file_id, token);

  const { data: subtitle } = await axiod.get<string>(link);

  const fileSavedAt = await saveFile(path, subtitle, file_name, renameTo);
  console.log(`File saved at ${fileSavedAt}`);
};

const seasonDownload = async (
  seasonImDbId: number,
  title: string,
  path: string,
  renameTo?: string,
) => {
  const seasonLink = getSeasonDownloadLink(seasonImDbId);

  const newTitle = title.match(/[a-z ]/gi)!.join("");

  const filePath = join(path, `${newTitle}.zip`);

  const { data: arrayBuffer } = await axiod.get<ArrayBuffer>(seasonLink, {
    responseType: "arraybuffer",
  });
  const fileData = new Uint8Array(arrayBuffer);

  await Deno.writeFile(filePath, fileData, { create: true });

  await decompressZipped(filePath);

  await processSubtitleFiles(renameTo);
};
