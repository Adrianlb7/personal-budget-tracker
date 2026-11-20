"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isValidAccountEmoji,
  isValidAccountIconPng,
  MAX_ACCOUNT_ICON_BYTES,
} from "@/domain/accounts/icon-validation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { completesInstallmentPayment } from "./calculations";
import type { RecurringStatus } from "./types";
import {
  recurringNameOrDefault,
  recurringSchema,
  type RecurringFormState,
} from "./validation";

const ICON_BUCKET = "recurring-icons";

type IconSelection =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "emoji"; emoji: string }
  | { kind: "image"; file: File };

function parseIconSelection(
  formData: FormData,
): { selection: IconSelection } | { error: RecurringFormState } {
  const rawEmoji = formData.get("iconEmoji");
  const emoji = typeof rawEmoji === "string" ? rawEmoji.trim() : "";
  const rawFile = formData.get("iconImage");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  const clear = formData.get("removeIcon") === "true";
  const choices =
    Number(Boolean(emoji)) + Number(Boolean(file)) + Number(clear);

  if (choices > 1) {
    return { error: { message: "Choose one recurring icon option." } };
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

function invalidImageState(): RecurringFormState {
  return {
    errors: {
      iconImage: ["Choose a square PNG under 2 MB (up to 1024 pixels)."],
    },
  };
}

export async function createRecurringCommitment(
  _state: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const result = recurringSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    destinationAccountId: formData.get("destinationAccountId") ?? "",
    endsOn: formData.get("endsOn") ?? "",
    frequency: formData.get("frequency"),
    installmentCount: formData.get("installmentCount") ?? "",
    installmentsCompleted: formData.get("installmentsCompleted") ?? "",
    kind: formData.get("kind"),
    name: recurringNameOrDefault(formData.get("name"), formData.get("kind")),
    nextDueOn: formData.get("nextDueOn"),
    paymentMethod: formData.get("paymentMethod") ?? "external_expense",
    startsOn: formData.get("startsOn"),
  });
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const iconInput = parseIconSelection(formData);
  if ("error" in iconInput) return iconInput.error;
  const selection = iconInput.selection;
  const png =
    selection.kind === "image" ? await readValidatedPng(selection.file) : null;
  if (selection.kind === "image" && !png) return invalidImageState();

  const user = await requireUser();
  const supabase = await createClient();
  const commitmentId = randomUUID();
  const { error } = await supabase.from("recurring_commitments").insert({
    account_id: null,
    amount: result.data.amount,
    currency: "USD",
    destination_account_id: result.data.destinationAccountId,
    ends_on: result.data.endsOn || null,
    frequency: result.data.frequency,
    icon_emoji: selection.kind === "emoji" ? selection.emoji : null,
    id: commitmentId,
    installment_count: result.data.installmentCount,
    installments_completed: result.data.installmentsCompleted,
    kind: result.data.kind,
    name: result.data.name,
    next_due_on: result.data.nextDueOn,
    payment_method: result.data.paymentMethod,
    starts_on: result.data.startsOn,
    user_id: user.id,
  });
  if (error) return { message: "The recurring payment could not be saved." };

  if (selection.kind === "image" && png) {
    const imagePath = `${user.id}/${commitmentId}/${randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(imagePath, png, { contentType: "image/png", upsert: false });

    if (!uploadError) {
      const { data, error: updateError } = await supabase
        .from("recurring_commitments")
        .update({ icon_image_path: imagePath })
        .eq("id", commitmentId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();
      if (!updateError && data) {
        revalidatePath("/app");
        revalidatePath("/app/recurring");
        redirect("/app/recurring");
      }
    }

    await supabase.storage.from(ICON_BUCKET).remove([imagePath]);
    const { error: rollbackError } = await supabase
      .from("recurring_commitments")
      .delete()
      .eq("id", commitmentId)
      .eq("user_id", user.id);
    if (rollbackError) {
      revalidatePath("/app/recurring");
      return {
        message:
          "Recurring payment saved without its image. Edit it to add the icon.",
      };
    }
    return { message: "The recurring icon could not be saved. Try again." };
  }

  revalidatePath("/app");
  revalidatePath("/app/recurring");
  redirect("/app/recurring");
}

export async function updateRecurringCommitment(
  id: string,
  _state: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const result = recurringSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    destinationAccountId: formData.get("destinationAccountId") ?? "",
    endsOn: formData.get("endsOn") ?? "",
    frequency: formData.get("frequency"),
    installmentCount: formData.get("installmentCount") ?? "",
    installmentsCompleted: formData.get("installmentsCompleted") ?? "",
    kind: formData.get("kind"),
    name: recurringNameOrDefault(formData.get("name"), formData.get("kind")),
    nextDueOn: formData.get("nextDueOn"),
    paymentMethod: formData.get("paymentMethod") ?? "external_expense",
    startsOn: formData.get("startsOn"),
  });
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const iconInput = parseIconSelection(formData);
  if ("error" in iconInput) return iconInput.error;
  const selection = iconInput.selection;

  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("recurring_commitments")
    .select("kind,status,icon_image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (loadError || !existing)
    return { message: "The recurring payment could not be found." };
  if (existing.kind !== result.data.kind)
    return { message: "The commitment type cannot be changed." };

  const completed = result.data.installmentsCompleted;
  const total = result.data.installmentCount;
  const status =
    result.data.kind === "external_installment" &&
    completed !== null &&
    total !== null &&
    completed >= total
      ? "completed"
      : existing.status === "completed"
        ? "active"
        : existing.status;

  let uploadedPath: string | null = null;
  if (selection.kind === "image") {
    const png = await readValidatedPng(selection.file);
    if (!png) return invalidImageState();
    uploadedPath = `${user.id}/${id}/${randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(uploadedPath, png, { contentType: "image/png", upsert: false });
    if (uploadError) {
      return { message: "The recurring icon could not be uploaded." };
    }
  }

  const iconUpdate: {
    icon_emoji?: string | null;
    icon_image_path?: string | null;
  } = {};
  if (selection.kind === "emoji") {
    iconUpdate.icon_emoji = selection.emoji;
    iconUpdate.icon_image_path = null;
  } else if (selection.kind === "clear") {
    iconUpdate.icon_emoji = null;
    iconUpdate.icon_image_path = null;
  } else if (selection.kind === "image") {
    iconUpdate.icon_emoji = null;
    iconUpdate.icon_image_path = uploadedPath;
  }

  let query = supabase
    .from("recurring_commitments")
    .update({
      amount: result.data.amount,
      ends_on: result.data.endsOn || null,
      frequency: result.data.frequency,
      installment_count: total,
      installments_completed: completed,
      name: result.data.name,
      next_due_on: result.data.nextDueOn,
      starts_on: result.data.startsOn,
      status,
      ...iconUpdate,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (selection.kind !== "keep") {
    query = existing.icon_image_path
      ? query.eq("icon_image_path", existing.icon_image_path)
      : query.is("icon_image_path", null);
  }
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) {
    if (uploadedPath) {
      await supabase.storage.from(ICON_BUCKET).remove([uploadedPath]);
    }
    return { message: "The recurring payment could not be updated." };
  }
  if (
    selection.kind !== "keep" &&
    existing.icon_image_path &&
    existing.icon_image_path !== uploadedPath
  ) {
    await supabase.storage.from(ICON_BUCKET).remove([existing.icon_image_path]);
  }
  revalidatePath("/app");
  revalidatePath("/app/recurring");
  revalidatePath(`/app/recurring/${id}`);
  redirect("/app/recurring");
}

export type PayRecurringState = {
  message?: string;
};

export async function payRecurringCommitment(
  id: string,
  _state: PayRecurringState,
  formData: FormData,
): Promise<PayRecurringState> {
  void _state;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: commitment } = await supabase
    .from("recurring_commitments")
    .select("kind,installment_count,installments_completed")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const completesCommitment = commitment
    ? completesInstallmentPayment({
        completed: commitment.installments_completed,
        kind: commitment.kind,
        total: commitment.installment_count,
      })
    : false;
  const paidOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("pay_recurring_commitment", {
    p_account_id: formData.get("accountId") || null,
    p_commitment_id: id,
    p_destination_account_id: formData.get("destinationAccountId") || null,
    p_paid_on: paidOn,
    p_payment_method: formData.get("paymentMethod") || "external_expense",
  });
  if (error || !data)
    return {
      message: error?.message.includes("Insufficient funds")
        ? "This payment is higher than the selected account's available balance."
        : (error?.message ?? "Payment could not be recorded."),
    };
  revalidatePath("/app");
  revalidatePath("/app/accounts");
  revalidatePath("/app/recurring");
  revalidatePath(`/app/recurring/${id}`);
  revalidatePath("/app/transactions");
  redirect(
    completesCommitment
      ? "/app/recurring?payment=commitment-completed"
      : "/app/recurring",
  );
}

export async function setRecurringStatus(id: string, status: RecurringStatus) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_commitments")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("The recurring payment could not be updated.");
  revalidatePath("/app");
  revalidatePath("/app/recurring");
  revalidatePath(`/app/recurring/${id}`);
}
