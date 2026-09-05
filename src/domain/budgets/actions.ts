"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  categoryNameKey,
  normalizeCategoryName,
} from "@/domain/categories/catalog";
import { budgetSchema, type BudgetFormState } from "./validation";

export async function saveMonthlyBudget(
  _state: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const result = budgetSchema.safeParse({
    amount: formData.get("amount"),
    category: formData.get("category"),
    currency: formData.get("currency"),
    month: formData.get("month"),
  });
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const user = await requireUser();
  const supabase = await createClient();
  const requestedCategory = normalizeCategoryName(result.data.category);
  const { data: existingCategories, error: lookupError } = await supabase
    .from("categories")
    .select("id,name,archived_at")
    .eq("user_id", user.id)
    .eq("kind", "expense");
  if (lookupError) return { message: "The category could not be prepared." };
  const existingCategory = existingCategories?.find(
    (category) =>
      categoryNameKey(category.name) === categoryNameKey(requestedCategory),
  );
  const categoryResult = existingCategory
    ? await supabase
        .from("categories")
        .update({ archived_at: null })
        .eq("id", existingCategory.id)
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("categories")
        .insert({
          kind: "expense",
          name: requestedCategory,
          user_id: user.id,
        })
        .select("id")
        .single();
  const { data: category, error: categoryError } = categoryResult;
  if (categoryError || !category)
    return { message: "The category could not be prepared." };

  const { error } = await supabase.from("monthly_budgets").upsert(
    {
      amount: result.data.amount,
      category_id: category.id,
      currency: result.data.currency,
      month: `${result.data.month}-01`,
      user_id: user.id,
    },
    { onConflict: "user_id,category_id,month,currency" },
  );
  if (error) return { message: "The monthly budget could not be saved." };
  revalidatePath("/app/budget");
  return { message: "Budget saved.", success: true };
}

export async function deleteMonthlyBudget(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("The budget could not be deleted.");
  revalidatePath("/app/budget");
}
