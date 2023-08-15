import { spinner } from "@lib";
import { client } from "../client.ts";
import { ansi, cliffy } from "@deps";
import { SearchData, SearchParams } from "@types";
import { animeToshoSearch } from "../animeTosho/search.ts";

export const openSubSearch = async ({
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
        message: `No sub for "${query}" on open subtitle. Would you like to search ${ansi.colors.blue(
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
        ansi.colors.red(
          "\nYou are offline 😭, Try again when you are connected"
        )
      );
    }

    if (isSearchError(e)) {
      console.error(
        ansi.colors.red(
          `\nSomething went wrong 😿, it seems that the ${e.response.data.errors.join(
            ","
          )}`
        )
      );
    } else {
      console.error(ansi.colors.red("\nSomething went wrong 😿"));
    }

    Deno.exit(1);
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
