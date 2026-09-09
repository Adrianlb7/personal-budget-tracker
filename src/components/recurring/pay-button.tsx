"use client";

import { useActionState, useState } from "react";
import { CircleDollarSign, X } from "lucide-react";
import type { Account } from "@/domain/accounts/types";
import type { RecurringKind } from "@/domain/recurring/types";
import {
  payRecurringCommitment,
  type PayRecurringState,
} from "@/domain/recurring/actions";

const initialState: PayRecurringState = {};

export function PayButton({
  accounts,
  id,
  kind,
}: {
  accounts: Account[];
  id: string;
  kind: RecurringKind;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<
    "external_expense" | "savings_reimbursement"
  >("external_expense");
  const [state, action, pending] = useActionState(
    payRecurringCommitment.bind(null, id),
    initialState,
  );

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        onClick={() => setOpen(true)}
        type="button"
      >
        <CircleDollarSign className="size-4" /> Pay
      </button>
      {open && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-5 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
          role="dialog"
        >
          <form
            action={action}
            className="w-full max-w-sm rounded-[1.6rem] border border-black/10 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Record payment</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Choose how this payment was handled.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <input name="paymentMethod" type="hidden" value={method} />
            {kind === "external_installment" && (
              <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                <MethodButton
                  active={method === "external_expense"}
                  label="Pay externally"
                  onClick={() => setMethod("external_expense")}
                />
                <MethodButton
                  active={method === "savings_reimbursement"}
                  label="Refund savings"
                  onClick={() => setMethod("savings_reimbursement")}
                />
              </div>
            )}
            <label
              className="mt-5 block text-sm font-medium"
              htmlFor={`pay-account-${id}`}
            >
              Payment account
            </label>
            <select
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
              defaultValue=""
              id={`pay-account-${id}`}
              name="accountId"
              required
            >
              <option disabled value="">Choose an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </option>
              ))}
            </select>
            {kind === "external_installment" &&
              method === "savings_reimbursement" && (
                <>
                  <label
                    className="mt-4 block text-sm font-medium"
                    htmlFor={`pay-destination-${id}`}
                  >
                    Savings destination
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
                    defaultValue=""
                    id={`pay-destination-${id}`}
                    name="destinationAccountId"
                    required
                  >
                    <option disabled value="">Choose savings</option>
                    {accounts
                      .filter((account) => account.type === "savings")
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} · {account.currency}
                        </option>
                      ))}
                  </select>
                </>
              )}
            {state.message && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {state.message}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <PaySubmit pending={pending} />
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function MethodButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white font-medium shadow-sm" : "text-neutral-500"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PaySubmit({ pending }: { pending: boolean }) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <CircleDollarSign className="size-4" />
      {pending ? "Paying…" : "Pay"}
    </button>
  );
}
