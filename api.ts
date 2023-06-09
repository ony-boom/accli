import { setAuthToken, getToken } from "./tokenManager.ts";
import {
  AuthPostData,
  AuthResponse,
  DownloadResponse,
  SearchData,
  SearchParams,
} from "./types.ts";
import { env } from "./config.ts";
import { axiod, join } from "./deps.ts";

const client = axiod.create({
  baseURL: "https://api.opensubtitles.com/api/v1",
  headers: {
    "Api-Key": env.ACCLI_API_KEY,
  },
});

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

  for (let i = 0; i < searchResult.length; i++) {
    const result = searchResult[i];
    console.log(`[${i + 1}]:`, result.attributes.feature_details.title);
  }

  return searchResult;
};

export const download = async (
  path = ".",
  param: SearchParams,
  fileId?: number,
  renameTo?: string
) => {
  let file_id = 0;

  if (fileId) {
    file_id = fileId;
  } else {
    const searchResult = await search(param);

    let chosenSubtitleIndex = prompt("\nWhich subtitle to download ? :", "1");

    while (!chosenSubtitleIndex) {
      chosenSubtitleIndex = prompt(
        "Select subtitle to download, subtitle index",
        "0"
      );
    }

    const chosenSubtitle = searchResult[Number(chosenSubtitleIndex) - 1];

    file_id = chosenSubtitle.attributes.files[0].file_id;
  }

  try {
    console.log("Downloading... ⌛");

    const token = await getToken();

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
      }
    );

    const { data: subtitle } = await axiod.get<string>(data.link);
    const extension = data.file_name.slice(data.file_name.lastIndexOf(".") + 1);

    const fileName = renameTo ? `${renameTo}.${extension}` : data.file_name;

    console.log(renameTo);

    const filePath = join(path, fileName);

    await Deno.writeTextFile(filePath, subtitle, { create: true });

    console.log("Downloaded ✅");
    console.log(`File saved at ${filePath}`);
  } catch (error) {
    console.log(error);
  }
};
