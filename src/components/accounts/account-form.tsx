"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  accountTypeLabels,
  accountTypes,
  currencies,
  type Account,
} from "@/domain/accounts/types";
import type { AccountFormState } from "@/domain/accounts/validation";

type AccountAction = (
  state: AccountFormState,
  formData: FormData,
) => Promise<AccountFormState>;

export function AccountForm({
  account,
  action,
}: {
  account?: Account;
  action: AccountAction;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className="mt-8 max-w-2xl space-y-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label className="text-sm font-medium" htmlFor="name">
          Account name
        </label>
        <input
          aria-describedby="name-error"
          className="mt-2 w-full rounded-xl border px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          defaultValue={account?.name}
          id="name"
          maxLength={80}
          name="name"
          placeholder="Main checking"
        />
        {state.errors?.name && (
          <FieldError id="name-error" message={state.errors.name[0]} />
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="type">
            Account type
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            defaultValue={account?.type ?? "checking"}
            id="type"
            name="type"
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {accountTypeLabels[type]}
              </option>
            ))}
          </select>
          {state.errors?.type && <FieldError message={state.errors.type[0]} />}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="currency">
            Currency
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            defaultValue={account?.currency ?? "USD"}
            id="currency"
            name="currency"
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          {state.errors?.currency && (
            <FieldError message={state.errors.currency[0]} />
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="openingBalance">
          Opening balance
        </label>
        <input
          aria-describedby="opening-balance-help opening-balance-error"
          className="mt-2 w-full rounded-xl border px-4 py-3 font-mono transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          defaultValue={account?.opening_balance}
          id="openingBalance"
          inputMode="decimal"
          name="openingBalance"
          placeholder="0"
          required
        />
        <p className="mt-2 text-sm text-neutral-500" id="opening-balance-help">
          Use either a comma or period for decimals. Enter liabilities as
          negative amounts.
        </p>
        {state.errors?.openingBalance && (
          <FieldError
            id="opening-balance-error"
            message={state.errors.openingBalance[0]}
          />
        )}
      </div>

      {state.message && (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <button
          className="rounded-xl bg-emerald-900 px-5 py-3 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : account ? "Save changes" : "Create account"}
        </button>
        <Link
          className="rounded-xl px-5 py-3 text-neutral-600 hover:bg-neutral-100"
          href="/app/accounts"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p className="mt-2 text-sm text-red-700" id={id}>
      {message}
    </p>
  );
}
