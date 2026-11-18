"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  isValidAccountEmoji,
  isValidAccountIconPng,
  MAX_ACCOUNT_ICON_BYTES,
} from "./icon-validation";
import { accountSchema, type AccountFormState } from "./validation";

const ICON_BUCKET = "account-icons";

type IconSelection =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "emoji"; emoji: string }
  | { kind: "image"; file: File };

function parseIconSelection(
  formData: FormData,
): { selection: IconSelection } | { error: AccountFormState } {
  const rawEmoji = formData.get("iconEmoji");
  const emoji = typeof rawEmoji === "string" ? rawEmoji.trim() : "";
  const rawFile = formData.get("iconImage");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  const clear = formData.get("removeIcon") === "true";
  const choices =
    Number(Boolean(emoji)) + Number(Boolean(file)) + Number(clear);

  if (choices > 1) {
    return { error: { message: "Choose one account icon option." } };
  }
  if (emoji) {
    if (!isValidAccountEmoji(emoji)) {
      return { error: { errors: { iconEmoji: ["Choose one emoji."] } } };
    }
    return { selection: { kind: "emoji", emoji } };
  }
  if (file) return { selection: { kind: "image", file } };
  if (clear) return { selection: { kind: "clear" } };
  return { selection: { kind: "keep" } };
}

async function readValidatedPng(file: File): Promise<ArrayBuffer | null> {
  if (file.size > MAX_ACCOUNT_ICON_BYTES) return null;

  const buffer = await file.arrayBuffer();
  return isValidAccountIconPng(new Uint8Array(buffer), file.type)
    ? buffer
    : null;
}

const parseAccountForm = (formData: FormData) =>
  accountSchema.safeParse({
    currency: formData.get("currency"),
    name: formData.get("name"),
    openingBalance: formData.get("openingBalance"),
    type: formData.get("type"),
  });

export async function createAccount(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const result = parseAccountForm(formData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const iconInput = parseIconSelection(formData);
  if ("error" in iconInput) return iconInput.error;
  const selection = iconInput.selection;
  const png =
    selection.kind === "image" ? await readValidatedPng(selection.file) : null;
  if (selection.kind === "image" && !png) {
    return {
      errors: {
        iconImage: ["Choose a square PNG under 2 MB (up to 1024 pixels)."],
      },
    };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const accountId = randomUUID();
  const { error } = await supabase.from("accounts").insert({
    currency: result.data.currency,
    icon_emoji: selection.kind === "emoji" ? selection.emoji : null,
    id: accountId,
    name: result.data.name,
    opening_balance: result.data.openingBalance,
    type: result.data.type,
    user_id: user.id,
  });

  if (error) {
    return { message: "The account could not be created. Please try again." };
  }

  if (selection.kind === "image" && png) {
    const imagePath = `${user.id}/${accountId}/${randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(imagePath, png, { contentType: "image/png", upsert: false });

    if (!uploadError) {
      const { data, error: updateError } = await supabase
        .from("accounts")
        .update({ icon_image_path: imagePath })
        .eq("id", accountId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (!updateError && data) {
        revalidatePath("/app/accounts");
        revalidatePath("/app");
        redirect("/app/accounts");
      }
    }

    await supabase.storage.from(ICON_BUCKET).remove([imagePath]);
    const { data: deleted, error: deleteError } = await supabase.rpc(
      "delete_empty_account",
      { p_account_id: accountId },
    );
    if (deleteError || !deleted) {
      return {
        message: "Account created without an icon. Edit it to add the image.",
      };
    }
    return { message: "The account image could not be saved. Try again." };
  }

  revalidatePath("/app/accounts");
  revalidatePath("/app");
  redirect("/app/accounts");
}

export async function updateAccount(
  accountId: string,
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const result = parseAccountForm(formData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const iconInput = parseIconSelection(formData);
  if ("error" in iconInput) return iconInput.error;

  const user = await requireUser();
  const supabase = await createClient();
  const { data: currentAccount, error: readError } = await supabase
    .from("accounts")
    .select("id,icon_image_path")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !currentAccount) {
    return { message: "The account could not be updated." };
  }

  const update: {
    currency: string;
    name: string;
    opening_balance: string;
    type: string;
    icon_emoji?: string | null;
    icon_image_path?: string | null;
  } = {
    currency: result.data.currency,
    name: result.data.name,
    opening_balance: result.data.openingBalance,
    type: result.data.type,
  };
  let uploadedPath: string | null = null;
  const selection = iconInput.selection;
  if (selection.kind === "emoji") {
    update.icon_emoji = selection.emoji;
    update.icon_image_path = null;
  } else if (selection.kind === "clear") {
    update.icon_emoji = null;
    update.icon_image_path = null;
  } else if (selection.kind === "image") {
    const png = await readValidatedPng(selection.file);
    if (!png) {
      return {
        errors: {
          iconImage: ["Choose a square PNG under 2 MB (up to 1024 pixels)."],
        },
      };
    }
    uploadedPath = `${user.id}/${accountId}/${randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(uploadedPath, png, { contentType: "image/png", upsert: false });
    if (uploadError) {
      return { message: "The account image could not be uploaded." };
    }
    update.icon_emoji = null;
    update.icon_image_path = uploadedPath;
  }

  let saved = false;
  try {
    let query = supabase
      .from("accounts")
      .update(update)
      .eq("id", accountId)
      .eq("user_id", user.id);
    if (selection.kind !== "keep") {
      query = currentAccount.icon_image_path
        ? query.eq("icon_image_path", currentAccount.icon_image_path)
        : query.is("icon_image_path", null);
    }
    const { data, error } = await query.select("id").maybeSingle();
    saved = !error && Boolean(data);
  } finally {
    if (!saved && uploadedPath) {
      await supabase.storage.from(ICON_BUCKET).remove([uploadedPath]);
    }
  }

  if (!saved) {
    return { message: "The account could not be updated." };
  }

  if (
    selection.kind !== "keep" &&
    currentAccount.icon_image_path &&
    currentAccount.icon_image_path !== uploadedPath
  ) {
    await supabase.storage
      .from(ICON_BUCKET)
      .remove([currentAccount.icon_image_path]);
  }

  revalidatePath("/app/accounts");
  revalidatePath("/app");
  redirect("/app/accounts");
}

export async function archiveAccount(accountId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("The account could not be archived.");
  }

  revalidatePath("/app/accounts");
}

export async function restoreAccount(accountId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: null })
    .eq("id", accountId)
    .eq("user_id", user.id);
  if (error) throw new Error("The account could not be restored.");
  revalidatePath("/app/accounts");
}

export async function deleteAccount(accountId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("accounts")
    .select("icon_image_path")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data, error } = await supabase.rpc("delete_empty_account", {
    p_account_id: accountId,
  });
  if (error || !data)
    throw new Error(
      "Only accounts without transaction history can be deleted.",
    );
  if (account?.icon_image_path) {
    await supabase.storage.from(ICON_BUCKET).remove([account.icon_image_path]);
  }
  revalidatePath("/app/accounts");
  revalidatePath("/app");
}
