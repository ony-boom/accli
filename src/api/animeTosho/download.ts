import { TEMP_DIR } from "@config";
import { download, ansi, walk } from "@deps";
import { getExtension, spinner } from "@lib";
import { ToshoResult } from "@types";
import { toshoAttachmentsSelectPrompt, renamePrompt } from "@prompts";

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
  const { animeId: id, title } = await toshoAttachmentsSelectPrompt(
    toshoSearchResult
  );

  spinner.start();
  const downloadLink = makeToshoAttachmentsLink(id, title);

  const saved = await download(downloadLink, {
    dir: TEMP_DIR,
    file: "subtitle.7z",
  });

  spinner.stop();
  const command = new Deno.Command("7z", {
    args: ["x", `./${TEMP_DIR}/${saved.file}`, "-y", `-o./${TEMP_DIR}`],
  });

  const { success, stderr } = await command.output();

  if (!success) {
    console.log(
      `Something went wrong when extracting the zip file \n. ${ansi.colors.red(
        "Do you have 7z ?"
      )}`,
      new TextDecoder().decode(stderr)
    );
  }

  const allSubDir = walk(TEMP_DIR, { maxDepth: 4 });
  const renameFileTo = await renamePrompt();

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
