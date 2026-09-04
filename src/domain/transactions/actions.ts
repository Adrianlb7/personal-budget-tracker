"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema, type TransactionFormState } from "./validation";

export async function createTransaction(
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const result = transactionSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    date: formData.get("date"),
    description: formData.get("description"),
    notes: formData.get("notes") ?? "",
    type: formData.get("type"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_financial_transaction", {
    p_account_id: result.data.accountId,
    p_amount: result.data.amount,
    p_category_name: result.data.category,
    p_date: result.data.date,
    p_description: result.data.description,
    p_notes: result.data.notes,
    p_type: result.data.type,
  });

  if (error)
    return { message: "The transaction could not be saved. Please try again." };

  revalidatePath("/app/accounts");
  revalidatePath("/app/transactions");
  redirect("/app/transactions");
}

export async function deleteTransaction(transactionId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_financial_transaction", {
    p_transaction_id: transactionId,
  });
  if (error || !data) throw new Error("The transaction could not be deleted.");
  revalidatePath("/app/accounts");
  revalidatePath("/app/transactions");
}
