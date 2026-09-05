export const DEFAULT_EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining",
  "Housing",
  "Utilities",
  "Transport",
  "Health",
  "Shopping",
  "Entertainment",
  "Education",
  "Travel",
  "Subscriptions",
  "Installments",
  "Other",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Gift",
  "Refund",
  "Other",
] as const;

export function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function categoryNameKey(value: string) {
  return normalizeCategoryName(value).toLocaleLowerCase("en-US");
}

export function categoryOptions(
  kind: "income" | "expense",
  existing: string[],
) {
  const defaults =
    kind === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const seen = new Set<string>();

  return [...existing, ...defaults].filter((name) => {
    const key = categoryNameKey(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
