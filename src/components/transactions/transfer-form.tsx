"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Account } from "@/domain/accounts/types";
import { createTransfer } from "@/domain/transactions/actions";

export function TransferForm({ accounts }: { accounts: Account[] }) {
  const [state, action, pending] = useActionState(createTransfer, {});

  return (
    <form
      action={action}
      className="mt-8 max-w-2xl space-y-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
    >
      <Field
        error={state.errors?.description?.[0]}
        label="Description"
        name="description"
        placeholder="Move to savings"
        required={false}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <AccountSelect
          accounts={accounts}
          error={state.errors?.sourceAccountId?.[0]}
          label="From account"
          name="sourceAccountId"
        />
        <AccountSelect
          accounts={accounts}
          error={state.errors?.destinationAccountId?.[0]}
          label="To account"
          name="destinationAccountId"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          error={state.errors?.amount?.[0]}
          help="Both accounts must use the same currency."
          inputMode="decimal"
          label="Amount"
          name="amount"
          placeholder="0"
        />
        <Field
          defaultValue={new Date().toISOString().slice(0, 10)}
          error={state.errors?.date?.[0]}
          label="Date"
          name="date"
          type="date"
        />
      </div>
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
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : "Add transfer"}
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

function AccountSelect({
  accounts,
  error,
  label,
  name,
}: {
  accounts: Account[];
  error?: string;
  label: string;
  name: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <select
        className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
        defaultValue=""
        id={name}
        name={name}
        required
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
      <ErrorText message={error} />
    </div>
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
