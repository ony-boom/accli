import { SearchData, SearchParams } from "@types";
import { client } from "./client.ts";
import { spinner } from "@lib";
import { colors } from "@deps";

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

    if (searchResult.length === 0) {
      console.error("No subtitle for this one 🥲");
      Deno.exit(1);
    }

    spinner.stop();
    return searchResult;
  } catch (e) {
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

type SearchError = {
  response: {
    data: { errors: string[] };
  };
};

// deno-lint-ignore ban-types
function isSearchError(error: {}): error is SearchError {
  return error && "response" in error;
}
