import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import type { TransactionIconSelection } from "./icon-selection";

const ICON_BUCKET = "transaction-icons";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function saveTransactionIcon(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string,
  selection: TransactionIconSelection,
): Promise<boolean> {
  if (selection.kind === "keep") return true;

  let uploadedPath: string | null = null;
  let iconSaved = false;
  try {
    const { data: current, error: readError } = await supabase
      .from("transactions")
      .select("icon_image_path")
      .eq("id", transactionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError || !current) return false;

    if (selection.kind === "image") {
      uploadedPath = `${userId}/${transactionId}/${randomUUID()}.png`;
      const { error: uploadError } = await supabase.storage
        .from(ICON_BUCKET)
        .upload(uploadedPath, selection.png, {
          contentType: "image/png",
          upsert: false,
        });
      if (uploadError) return false;
    }

    const { data: saved, error: saveError } = await supabase.rpc(
      "set_transaction_icon",
      {
        p_transaction_id: transactionId,
        p_icon_emoji: selection.kind === "emoji" ? selection.emoji : null,
        p_icon_image_path: uploadedPath,
      },
    );
    if (saveError || !saved) {
      if (uploadedPath)
        await supabase.storage.from(ICON_BUCKET).remove([uploadedPath]);
      return false;
    }
    iconSaved = true;
    if (current.icon_image_path && current.icon_image_path !== uploadedPath) {
      try {
        await supabase.storage
          .from(ICON_BUCKET)
          .remove([current.icon_image_path]);
      } catch {
        // Cleanup can be retried later; the new icon was already saved.
      }
    }
    return true;
  } catch {
    // The financial RPC may already have succeeded. Report only icon failure.
    if (!iconSaved && uploadedPath) {
      try {
        await supabase.storage.from(ICON_BUCKET).remove([uploadedPath]);
      } catch {
        // Storage cleanup is best effort after an icon failure.
      }
    }
    return false;
  }
}

export async function removeTransactionIcon(
  supabase: SupabaseClient,
  path: string | null,
) {
  if (!path) return;
  try {
    await supabase.storage.from(ICON_BUCKET).remove([path]);
  } catch {
    // The financial transaction was already deleted; cleanup is best effort.
  }
}
