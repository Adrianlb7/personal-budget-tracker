"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { completesInstallmentPayment } from "./calculations";
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
  const { error } = await supabase.from("recurring_commitments").insert({
    account_id: null,
    amount: result.data.amount,
    currency: "USD",
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

  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("recurring_commitments")
    .select("kind,status")
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
  const { error } = await supabase
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
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { message: "The recurring payment could not be updated." };
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
}
