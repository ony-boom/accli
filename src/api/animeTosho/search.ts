import { spinner } from "@lib";
import { ansi, axiod } from "@deps";
import { ToshoResult } from "@types";
import { downloadToshoAttachments } from "./download.ts";

export const animeToshoSearch = async (query: string, languages: string) => {
  spinner.stop();
  spinner.text = `Searching through ${ansi.colors.blue("animeTosho")}`;
  try {
    spinner.start();
    const url = "https://feed.animetosho.org/json";

    const { data: toshoResult } = await axiod.get<ToshoResult[]>(url, {
      params: {
        q: query,
      },
    });
    if (toshoResult.length < 1) {
      spinner.fail(
        "Really at this point i don't know where to find the subtitle, just give up already 👀"
      );
      Deno.exit(1);
    }
    await downloadToshoAttachments(toshoResult, languages);
  } catch (e) {
    // handle error on the search function
    throw e;
  }
};
