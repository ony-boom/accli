import { axiod } from "@deps";
import { config } from "@config";

export const client = axiod.create({
  baseURL: "https://api.opensubtitles.com/api/v1",
  headers: {
    "Api-Key": config.apiKey,
  },
});
