import {
  setAuthToken,
  getToken,
  decompressZipped,
  processSubtitleFiles,
  saveFile,
} from "@lib";

import {
  AuthPostData,
  AuthResponse,
  DownloadParams,
  DownloadResponse,
  SearchData,
  SearchParams,
} from "@types";
import { DEFAULT_APP_NAME, config, tweaks } from "@config";
import { axiod, join, wait } from "@deps";

const client = axiod.create({
  baseURL: "https://api.opensubtitles.com/api/v1",
  headers: {
    "Api-Key": config.apiKey,
  },
});

const spinner = wait("Downloading...⌛");

const getSeasonDownloadLink = (imDbId: number) =>
  `https://www.opensubtitles.org/download/s/sublanguageid-fre/pimdbid-${imDbId}/season-1`;

export const auth = async () => {
  const authData: AuthPostData = {
    password: config.password,
    username: config.username,
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

  spinner.text = "Searching...🔍";

  spinner.start();

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

  if (searchResult.length === 0) {
    console.error("No subtitle for this one 🥲");
    Deno.exit(1);
  }

  spinner.stop();
  return searchResult;
};

export const download = async ({
  path = "./",
  fileId,
  renameTo,
}: DownloadParams) => {
  spinner.text = "Downloading...⌛";
  try {
    spinner.start();
    await episodeDownload(fileId, path, renameTo);
  } catch {
    spinner.stop();
    console.error("Something bad happened 😵, try again");
  }
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
        "Api-Key": config.apiKey,
      },
    }
  );

  return data;
};

const episodeDownload = async (
  file_id: number,
  path: string,
  renameTo?: string
) => {
  const token = await getToken();
  const { link, file_name } = await getSubtitleDownloadInfo(file_id, token);

  const { data: subtitle } = await axiod.get<string>(link);

  spinner.text = "Saving file... 🗃️";

  const fileSavedAt = await saveFile(path, subtitle, file_name, renameTo);

  spinner.succeed(`File saved at ${fileSavedAt}`);
  spinner.stop();
  spinner.clear();
};

const seasonDownload = async (
  seasonImDbId: number,
  title: string,
  path: string,
  renameTo?: string
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

export const getAppNameArt = async () => {
  const url = "https://asciified.thelicato.io/api";

  if (tweaks.appName) {
    try {
      const { data } = await axiod.get<string>(`${url}`, {
        params: {
          font: "ANSI Shadow",
          text: tweaks.appName || "accli",
        },
        responseType: "text",
      });

      return data;
    } catch {
      /* Do nothing */
    }
  }
  return DEFAULT_APP_NAME;
};
