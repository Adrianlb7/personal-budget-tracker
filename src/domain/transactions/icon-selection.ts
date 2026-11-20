import {
  isValidAccountEmoji,
  isValidAccountIconPng,
  MAX_ACCOUNT_ICON_BYTES,
} from "@/domain/accounts/icon-validation";

export type TransactionIconSelection =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "emoji"; emoji: string }
  | { kind: "image"; png: ArrayBuffer };

export type TransactionIconInput =
  | { selection: TransactionIconSelection }
  | {
      errors: { iconEmoji?: string[]; iconImage?: string[] };
      message?: string;
    };

export async function parseTransactionIconSelection(
  formData: FormData,
): Promise<TransactionIconInput> {
  const rawEmoji = formData.get("iconEmoji");
  const emoji = typeof rawEmoji === "string" ? rawEmoji.trim() : "";
  const rawFile = formData.get("iconImage");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  const clear = formData.get("removeIcon") === "true";
  const choices =
    Number(Boolean(emoji)) + Number(Boolean(file)) + Number(clear);

  if (choices > 1) {
    return {
      errors: {},
      message: "Choose one transaction icon option.",
    };
  }
  if (emoji) {
    return isValidAccountEmoji(emoji)
      ? { selection: { kind: "emoji", emoji } }
      : { errors: { iconEmoji: ["Choose one emoji."] } };
  }
  if (file) {
    if (file.size > MAX_ACCOUNT_ICON_BYTES) {
      return {
        errors: {
          iconImage: ["Choose a square PNG under 2 MB (up to 1024 pixels)."],
        },
      };
    }
    const png = await file.arrayBuffer();
    return isValidAccountIconPng(new Uint8Array(png), file.type)
      ? { selection: { kind: "image", png } }
      : {
          errors: {
            iconImage: ["Choose a square PNG under 2 MB (up to 1024 pixels)."],
          },
        };
  }
  return { selection: { kind: clear ? "clear" : "keep" } };
}
