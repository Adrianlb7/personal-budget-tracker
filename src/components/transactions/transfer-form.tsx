"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Account } from "@/domain/accounts/types";
import { exceedsAvailableBalance } from "@/domain/accounts/balance";
import { createTransfer } from "@/domain/transactions/actions";
import { convertClpToUsd } from "@/domain/fx/calculations";
import { formatMoney } from "@/lib/money/format";

export function TransferForm({ accounts }: { accounts: Account[] }) {
  const [state, action, pending] = useActionState(createTransfer, {});
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const source = accounts.find((account) => account.id === sourceId);
  const sourceBalance = source?.current_balance ?? source?.opening_balance;
  const insufficient = Boolean(
    source?.type !== "credit_debt" &&
    sourceBalance &&
    amount &&
    exceedsAvailableBalance(amount, sourceBalance),
  );
  const converted = useMemo(() => {
    try {
      const cleanAmount = amount.replace(",", ".");
      const cleanRate = rate.replace(",", ".");
      if (!cleanAmount || !cleanRate) return null;
      return convertClpToUsd(cleanAmount, cleanRate);
    } catch {
      return null;
    }
  }, [amount, rate]);
  const destinations = source
    ? accounts.filter((account) =>
        source.currency === "CLP"
          ? account.currency === "USD" && account.type === "checking"
          : account.currency === "USD" && account.id !== source.id,
      )
    : accounts.filter((account) => account.currency !== "BTC");

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
          accounts={accounts.filter((account) => account.currency !== "BTC")}
          error={state.errors?.sourceAccountId?.[0]}
          label="From account"
          name="sourceAccountId"
          onChange={setSourceId}
        />
        <AccountSelect
          accounts={destinations}
          error={state.errors?.destinationAccountId?.[0]}
          label="To account"
          name="destinationAccountId"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          error={state.errors?.amount?.[0]}
          help={
            source
              ? `Available: ${formatMoney(sourceBalance ?? "0", source.currency)}`
              : "Choose a source account to see the available balance."
          }
          inputMode="decimal"
          label="Amount"
          name="amount"
          placeholder="0"
          onChange={setAmount}
        />
        {insufficient && (
          <p className="-mt-4 text-sm text-red-700 sm:col-span-2" role="alert">
            The amount is higher than the available balance.
          </p>
        )}
        <Field
          defaultValue={new Date().toISOString().slice(0, 10)}
          error={state.errors?.date?.[0]}
          label="Date"
          name="date"
          type="date"
        />
      </div>
      {source?.currency === "CLP" && (
        <div className="rounded-2xl bg-emerald-50/70 p-4">
          <Field
            error={state.errors?.exchangeRate?.[0]}
            help="Enter the rate shown by your bank, for example 910 CLP per USD."
            inputMode="decimal"
            label="Bank rate · CLP per USD"
            name="exchangeRate"
            onChange={setRate}
            placeholder="910"
          />
          <p className="mt-3 text-sm text-emerald-900">
            USD received:{" "}
            <strong>{converted ? formatMoney(converted, "USD") : "—"}</strong>
          </p>
        </div>
      )}
      {source?.currency !== "CLP" && (
        <input name="exchangeRate" type="hidden" value="" />
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
  onChange,
}: {
  accounts: Account[];
  error?: string;
  label: string;
  name: string;
  onChange?: (value: string) => void;
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
        onChange={(event) => onChange?.(event.target.value)}
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
