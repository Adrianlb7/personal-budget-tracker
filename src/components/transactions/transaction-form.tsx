"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CategoryCombobox } from "@/components/categories/category-combobox";
import type { Account } from "@/domain/accounts/types";
import { exceedsAvailableBalance } from "@/domain/accounts/balance";
import { createTransaction } from "@/domain/transactions/actions";
import { formatMoney } from "@/lib/money/format";

export function TransactionForm({
  accounts,
  categories,
  type,
}: {
  accounts: Account[];
  categories: string[];
  type: "income" | "expense";
}) {
  const [state, action, pending] = useActionState(createTransaction, {});
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const available =
    selectedAccount?.current_balance ?? selectedAccount?.opening_balance;
  const insufficient = Boolean(
    type === "expense" &&
    selectedAccount?.type !== "credit_debt" &&
    available &&
    amount &&
    exceedsAvailableBalance(amount, available),
  );
  const title = type === "income" ? "Income" : "Expense";

  return (
    <form
      action={action}
      className="mt-8 max-w-2xl space-y-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
    >
      <input name="type" type="hidden" value={type} />
      <Field
        label="Description"
        name="description"
        error={state.errors?.description?.[0]}
        placeholder={type === "income" ? "September salary" : "Groceries"}
        required={false}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="accountId">
            Account
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
            id="accountId"
            name="accountId"
            onChange={(event) => setAccountId(event.target.value)}
            required
            defaultValue=""
          >
            <option disabled value="">
              Choose an account
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
          <ErrorText message={state.errors?.accountId?.[0]} />
        </div>
        <Field
          label="Date"
          name="date"
          error={state.errors?.date?.[0]}
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Amount"
          name="amount"
          error={state.errors?.amount?.[0]}
          inputMode="decimal"
          placeholder="0"
          help="Use a comma or period for decimals."
          onChange={setAmount}
        />
        <div>
          <label className="text-sm font-medium" htmlFor="transaction-category">
            Category
          </label>
          <CategoryCombobox
            categories={categories}
            error={state.errors?.category?.[0]}
            id="transaction-category"
            placeholder={
              type === "income"
                ? "Choose income category"
                : "Choose expense category"
            }
          />
        </div>
      </div>
      {type === "expense" && selectedAccount && (
        <p
          className={`text-sm ${insufficient ? "text-red-700" : "text-neutral-500"}`}
        >
          Available: {formatMoney(available ?? "0", selectedAccount.currency)}
          {insufficient && " · The expense is higher than this balance."}
        </p>
      )}
      <div>
        <label className="text-sm font-medium" htmlFor="notes">
          Notes <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border px-4 py-3"
          id="notes"
          maxLength={2000}
          name="notes"
        />
        <ErrorText message={state.errors?.notes?.[0]} />
      </div>
      {state.message && (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <div className="flex gap-3 border-t pt-6">
        <button
          className="rounded-xl bg-emerald-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          disabled={pending || insufficient}
          type="submit"
        >
          {pending ? "Saving…" : `Add ${title.toLowerCase()}`}
        </button>
        <Link
          className="rounded-xl px-5 py-3 text-neutral-600 hover:bg-neutral-100"
          href="/app/transactions"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  defaultValue,
  error,
  help,
  inputMode,
  label,
  name,
  placeholder,
  onChange,
  required = true,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  help?: string;
  inputMode?: "decimal";
  label: string;
  name: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-xl border px-4 py-3"
        defaultValue={defaultValue}
        id={name}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {help && <p className="mt-2 text-sm text-neutral-500">{help}</p>}
      <ErrorText message={error} />
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="mt-2 text-sm text-red-700">{message}</p>
  ) : null;
}
