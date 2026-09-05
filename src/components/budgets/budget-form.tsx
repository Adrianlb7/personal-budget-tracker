"use client";

import { useActionState } from "react";
import { CategoryCombobox } from "@/components/categories/category-combobox";
import type { Currency } from "@/domain/accounts/types";
import { saveMonthlyBudget } from "@/domain/budgets/actions";

export function BudgetForm({
  categories,
  currency,
  month,
}: {
  categories: string[];
  currency: Currency;
  month: string;
}) {
  const [state, action, pending] = useActionState(saveMonthlyBudget, {});
  return (
    <form action={action} className="mt-5 space-y-4">
      <input name="month" type="hidden" value={month} />
      <div>
        <label className="text-sm font-medium" htmlFor="budget-category">
          Category
        </label>
        <CategoryCombobox
          categories={categories}
          error={state.errors?.category?.[0]}
          id="budget-category"
          placeholder="Choose an expense category"
        />
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="budget-amount">
            Monthly limit
          </label>
          <input
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
            id="budget-amount"
            inputMode="decimal"
            name="amount"
            placeholder="0"
            required
          />
          <ErrorText message={state.errors?.amount?.[0]} />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="budget-currency">
            Currency
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-3 py-3"
            defaultValue={currency}
            id="budget-currency"
            name="currency"
          >
            <option value="USD">USD</option>
            <option value="CLP">CLP</option>
          </select>
        </div>
      </div>
      {state.message && (
        <p
          className={`text-sm ${state.success ? "text-emerald-700" : "text-red-700"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        disabled={pending}
        style={{ marginTop: "0.875rem" }}
        type="submit"
      >
        {pending ? "Saving…" : "Set budget"}
      </button>
    </form>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="mt-2 text-sm text-red-700">{message}</p>
  ) : null;
}
