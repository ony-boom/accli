import { config, TEMP_DIR } from "@config";
import { client } from "./client.ts";
import { axiod, download, colors, walk, cliffy } from "@deps";
import { getChosenToshoAttachments, getToken, saveFile, spinner } from "@lib";
import { DownloadParams, DownloadResponse, ToshoResult } from "@types";
import { getExtension } from "../lib/utils.ts";

export const getSeasonDownloadLink = (imDbId: number) =>
  `https://www.opensubtitles.org/download/s/sublanguageid-fre/pimdbid-${imDbId}/season-1`;

export const makeToshoAttachmentsLink = (id: number, title: string) => {
  const baseLink = "https://animetosho.org/storage/torattachpk";

  const urlTitle = encodeURI(title);

  return `${baseLink}/${id}/${urlTitle}.7z`;
};

export const downloadToshoAttachments = async (
  toshoSearchResult: ToshoResult[],
  languages: string
) => {
  spinner.stop();
  spinner.text = "Downloading attachments";
  const { animeId: id, title } = await getChosenToshoAttachments(
    toshoSearchResult
  );

  spinner.start();
  const downloadLink = makeToshoAttachmentsLink(id, title);

  const saved = await download(downloadLink, {
    dir: TEMP_DIR,
    file: `${title}.7z`,
  });

  spinner.stop();
  const command = new Deno.Command("7z", {
    args: ["x", `./${TEMP_DIR}/${saved.file}`, "-y", `-o./${TEMP_DIR}`],
  });

  const { success, stderr } = await command.output();

  if (!success) {
    console.log(
      `Something went wrong when extracting the zip file \n. ${colors.colors.red(
        "Do you have 7z "
      )}`,
      new TextDecoder().decode(stderr)
    );
  }

  const allSubDir = walk(TEMP_DIR, { maxDepth: 4 });
  const renameFileTo = await cliffy.Input.prompt({
    message: "Rename downloaded subtitle to ?",
    hint: colors.colors.gray(
      `${colors.colors.italic("%I%")} will be replaced by episode number`
    ),
  });

  let episodeNumber = "";
  for await (const content of allSubDir) {
    if (content.isDirectory) {
      episodeNumber = content.name
        .match(/S\d{2}E\d{2}/)
        ?.join("")
        .split("E")
        .at(-1) as string;
    }

    const extension = getExtension(content.name);
    const isChosenLanguages = content.name.includes(languages);

    if (isChosenLanguages) {
      await Deno.copyFile(
        content.path,
        `./${
          renameFileTo.replace("%I%", episodeNumber) || content.name
        }.${extension}`
      );
    }
  }

  spinner.succeed(`Done ✅`);
  await Deno.remove(TEMP_DIR, { recursive: true });
};

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
  spinner.stop();
  spinner.clear();
};
