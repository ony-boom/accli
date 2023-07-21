import { axiod, join } from "@deps";
import { DownloadParams, DownloadResponse } from "@types";
import { client } from "./client.ts";
import { config } from "@config";
import {
  decompressZipped,
  getToken,
  processSubtitleFiles,
  saveFile,
  spinner,
} from "@lib";


export const getSeasonDownloadLink = (imDbId: number) =>
  `https://www.opensubtitles.org/download/s/sublanguageid-fre/pimdbid-${imDbId}/season-1`;


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
