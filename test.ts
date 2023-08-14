import { walk } from "@deps";
import { TEMP_DIR } from "@config";
import { getExtension } from "@lib";

const allSubDir = walk(TEMP_DIR, { maxDepth: 4 });
let ep = "";

for await (const content of allSubDir) {
  if (content.isDirectory) {
    ep = content.name
      .match(/S\d{2}E\d{2}/)
      ?.join("")
      .split("E")
      .at(-1) as string;
  }

  // if (!ep) continue
  const extension = getExtension(content.name);
  const isSubFile = ["srt", "ass", "vtt"].includes(extension);

  // if (!isSubFile) continue
  const isChosenLanguages = content.name.includes('fr');

  if (isChosenLanguages) {
    console.log(ep);
    console.log(content.name);
  }
}
