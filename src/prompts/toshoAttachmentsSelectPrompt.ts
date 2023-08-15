import { ToshoResult } from "@types";
import { cliffy } from "@deps";

export const toshoAttachmentsSelectPrompt = async (
  toshoResults: ToshoResult[]
) => {
  const options = toshoResults.map((option) => ({
    value: { animeId: option.id, title: option.title },
    name: option.title,
  }));

  const chosenAttachments = await cliffy.Select.prompt({
    options,
    message: "Get attachments from ?",
    search: true,
  });

  return chosenAttachments as unknown as { animeId: number; title: string };
};
