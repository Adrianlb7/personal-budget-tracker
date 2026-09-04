"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { accountSchema, type AccountFormState } from "./validation";

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

  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    currency: result.data.currency,
    name: result.data.name,
    opening_balance: result.data.openingBalance,
    type: result.data.type,
    user_id: user.id,
  });

  if (error) {
    return { message: "The account could not be created. Please try again." };
  }

  revalidatePath("/app/accounts");
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

  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .update({
      currency: result.data.currency,
      name: result.data.name,
      opening_balance: result.data.openingBalance,
      type: result.data.type,
    })
    .eq("id", accountId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "The account could not be updated." };
  }

  revalidatePath("/app/accounts");
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
