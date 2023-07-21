import { DEFAULT_APP_NAME, tweaks } from "@config";
import { axiod } from "@deps";

export const getAppNameArt = async () => {
  const url = "https://asciified.thelicato.io/api/v2/ascii";

  if (tweaks.appName) {
    try {
      const { data } = await axiod.get<string>(`${url}`, {
        params: {
          font: tweaks.asciiFont || "ANSI Shadow",
          text: (tweaks.appName || "accli").replaceAll(" ", "+"),
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
