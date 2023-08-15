import { axiod } from "@deps";
import { config } from "@config";
import { getToken } from "./token.ts";
import { client } from "../client.ts";
import { saveFile, spinner } from "@lib";
import { DownloadParams, DownloadResponse } from "@types";

export const getSeasonDownloadLink = (imDbId: number) =>
  `https://www.opensubtitles.org/download/s/sublanguageid-fre/pimdbid-${imDbId}/season-1`;

export const subDownload = async ({
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
};
