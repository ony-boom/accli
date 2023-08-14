import { spinner } from "@lib";
import { client } from "./client.ts";
import { colors, cliffy, axiod } from "@deps";
import { downloadToshoAttachments } from "./download.ts";
import { SearchData, SearchParams, ToshoResult } from "@types";

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

  spinner.text = "Searching...🔍";

  spinner.start();

  const queryParams: Record<string, string | number> = {};

  for (const param of extraParamList) {
    for (const key in param) {
      const paramName = key as keyof typeof param;
      if (param[paramName]) {
        queryParams[key] = param[paramName]!;
      }
    }
  }

  try {
    const {
      data: { data: searchResult },
    } = await client.get<SearchData>("/subtitles", {
      params: { query, languages: ln, ...queryParams },
    });
    spinner.stop();
    if (searchResult.length === 0) {
      const searchWithAnimeTosho = await cliffy.Confirm.prompt({
        message: `No sub for "${query}" on open subtitle. Would you like to search ${colors.colors.blue(
          "attachments"
        )} on animeTosho ?`,
      });

      if (!searchWithAnimeTosho) {
        Deno.exit(1);
      }

      await animeToshoSearch(query, ln);
    }

    spinner.stop();
    return searchResult;
  } catch (e) {
    console.log(e);

    if (e.message?.startsWith("error sending request for url")) {
      console.error(
        colors.colors.red(
          "\nYou are offline 😭, Try again when you are connected"
        )
      );
    }

    if (isSearchError(e)) {
      console.error(
        colors.colors.red(
          `\nSomething went wrong 😿, it seems that the ${e.response.data.errors.join(
            ","
          )}`
        )
      );
    } else {
      console.error(colors.colors.red("\nSomething went wrong 😿"));
    }

    Deno.exit(1);
  }
};

const animeToshoSearch = async (query: string, languages: string) => {
  spinner.stop();
  spinner.text = `Searching through ${colors.colors.blue("animeTosho")}`;
  spinner.start();
  try {
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

type SearchError = {
  response: {
    data: { errors: string[] };
  };
};

// deno-lint-ignore ban-types
function isSearchError(error: {}): error is SearchError {
  return error && "response" in error;
}
