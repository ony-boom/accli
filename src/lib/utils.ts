import { tweaks } from "@config";
import { gradient } from "@deps";
import { getAppNameArt } from "@api";

export const getExtension = (file: string) =>
  file.slice(file.lastIndexOf(".") + 1);

export const showAppName = async () => {
  if (tweaks.showAppName) {
    const appName = gradient.pastel(await getAppNameArt());
    console.log(appName);
  }
};
