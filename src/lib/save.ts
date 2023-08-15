import { join } from "@deps";
import { getExtension } from "./utils.ts";

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
