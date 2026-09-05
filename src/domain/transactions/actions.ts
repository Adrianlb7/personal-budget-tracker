"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { decimal } from "@/lib/money/decimal";
import {
  categoryNameKey,
  normalizeCategoryName,
} from "@/domain/categories/catalog";
import {
  transactionDescriptionOrDefault,
  transactionSchema,
  type TransactionFormState,
} from "./validation";
import { transferSchema, type TransferFormState } from "./transfer-validation";

export async function createTransaction(
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const result = transactionSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    date: formData.get("date"),
    description: transactionDescriptionOrDefault(
      formData.get("description"),
      formData.get("type"),
    ),
    notes: formData.get("notes") ?? "",
    type: formData.get("type"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const user = await requireUser();
  const supabase = await createClient();
  const { data: transactionAccount, error: accountError } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", result.data.accountId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (accountError || !transactionAccount)
    return { message: "The selected account is unavailable." };
  if (transactionAccount.currency !== "USD")
    return { message: "Income and expenses require a USD account." };
  const requestedCategory = normalizeCategoryName(result.data.category);
  const { data: matchingCategories, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,archived_at")
    .eq("user_id", user.id)
    .eq("kind", result.data.type);
  if (categoryError) return { message: "The category could not be prepared." };
  const existingCategory = matchingCategories?.find(
    (category) =>
      categoryNameKey(category.name) === categoryNameKey(requestedCategory),
  );
  if (existingCategory?.archived_at) {
    const { error: restoreError } = await supabase
      .from("categories")
      .update({ archived_at: null })
      .eq("id", existingCategory.id)
      .eq("user_id", user.id);
    if (restoreError) return { message: "The category could not be restored." };
  }
  const { error } = await supabase.rpc("create_financial_transaction", {
    p_account_id: result.data.accountId,
    p_amount: result.data.amount,
    p_category_name: existingCategory?.name ?? requestedCategory,
    p_date: result.data.date,
    p_description: result.data.description,
    p_notes: result.data.notes,
    p_type: result.data.type,
  });

  if (error)
    return {
      message: error.message.includes("Insufficient funds")
        ? "This expense is higher than the account's available balance."
        : "The transaction could not be saved. Please try again.",
    };

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

export async function createTransfer(
  _state: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const result = transferSchema.safeParse({
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    destinationAccountId: formData.get("destinationAccountId"),
    exchangeRate: formData.get("exchangeRate") ?? "",
    notes: formData.get("notes") ?? "",
    sourceAccountId: formData.get("sourceAccountId"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const user = await requireUser();
  const supabase = await createClient();
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("id,currency,type")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .in("id", [result.data.sourceAccountId, result.data.destinationAccountId]);
  if (accountsError || accounts?.length !== 2)
    return { message: "One of the selected accounts is unavailable." };
  const source = accounts.find(
    (account) => account.id === result.data.sourceAccountId,
  )!;
  const destination = accounts.find(
    (account) => account.id === result.data.destinationAccountId,
  )!;
  if (source.currency === "BTC" || destination.currency === "BTC")
    return { message: "Bitcoin accounts are holding-only." };
  if (source.currency === "CLP") {
    if (destination.currency !== "USD" || destination.type !== "checking")
      return {
        message: "CLP can only be transferred to a USD checking account.",
      };
    if (
      !result.data.exchangeRate ||
      !decimal(result.data.exchangeRate).greaterThan(0)
    )
      return { message: "Enter your bank's CLP per USD rate." };
    const { error } = await supabase.rpc("create_clp_usd_transfer", {
      p_clp_amount: result.data.amount,
      p_clp_per_usd: result.data.exchangeRate,
      p_date: result.data.date,
      p_description: result.data.description,
      p_destination_account_id: result.data.destinationAccountId,
      p_notes: result.data.notes,
      p_source_account_id: result.data.sourceAccountId,
    });
    if (error)
      return {
        message: error.message.includes("Insufficient funds")
          ? "This transfer is higher than the source account's available balance."
          : "The converted transfer could not be saved.",
      };
    revalidatePath("/app");
    revalidatePath("/app/accounts");
    revalidatePath("/app/transactions");
    redirect("/app/transactions");
  }
  if (source.currency !== "USD" || destination.currency !== "USD")
    return {
      message: "Only USD transfers and CLP to USD conversions are supported.",
    };
  const { error } = await supabase.rpc("create_account_transfer", {
    p_amount: result.data.amount,
    p_date: result.data.date,
    p_description: result.data.description,
    p_destination_account_id: result.data.destinationAccountId,
    p_notes: result.data.notes,
    p_source_account_id: result.data.sourceAccountId,
  });

  if (error) {
    const message = error.message.includes("Insufficient funds")
      ? "This transfer is higher than the source account's available balance."
      : error.message.includes("Cross-currency")
        ? "Source and destination accounts must use the same currency."
        : "The transfer could not be saved. Please try again.";
    return { message };
  }

  revalidatePath("/app/accounts");
  revalidatePath("/app/transactions");
  redirect("/app/transactions");
}
