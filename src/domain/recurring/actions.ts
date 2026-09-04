"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { RecurringStatus } from "./types";
import {
  recurringNameOrDefault,
  recurringSchema,
  type RecurringFormState,
} from "./validation";

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

  const user = await requireUser();
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", result.data.accountId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (!account) return { message: "Choose an active account." };
  const { error } = await supabase.from("recurring_commitments").insert({
    account_id: result.data.accountId,
    amount: result.data.amount,
    currency: account.currency,
    destination_account_id: result.data.destinationAccountId,
    ends_on: result.data.endsOn || null,
    frequency: result.data.frequency,
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
  revalidatePath("/app");
  revalidatePath("/app/recurring");
  redirect("/app/recurring");
}

export type PayRecurringState = {
  message?: string;
};

export async function payRecurringCommitment(
  id: string,
  _state: PayRecurringState,
): Promise<PayRecurringState> {
  void _state;
  await requireUser();
  const supabase = await createClient();
  const paidOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("pay_recurring_commitment", {
    p_commitment_id: id,
    p_paid_on: paidOn,
  });
  if (error || !data)
    return {
      message:
        "Payment could not be recorded. Apply the latest Supabase migration and try again.",
    };
  revalidatePath("/app");
  revalidatePath("/app/accounts");
  revalidatePath("/app/recurring");
  revalidatePath("/app/transactions");
  return {};
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
}
