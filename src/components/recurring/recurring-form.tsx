"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Account } from "@/domain/accounts/types";
import { createRecurringCommitment } from "@/domain/recurring/actions";
import type { RecurringKind } from "@/domain/recurring/types";

export function RecurringForm({
  accounts,
  kind,
}: {
  accounts: Account[];
  kind: RecurringKind;
}) {
  const [state, action, pending] = useActionState(
    createRecurringCommitment,
    {},
  );
  const installment = kind === "external_installment";
  const today = new Date().toISOString().slice(0, 10);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "external_expense" | "savings_reimbursement"
  >("external_expense");
  return (
    <form
      action={action}
      className="mt-8 max-w-2xl space-y-6 rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8"
    >
      <input name="kind" type="hidden" value={kind} />
      <input name="paymentMethod" type="hidden" value={paymentMethod} />
      <Field
        error={state.errors?.name?.[0]}
        label="Name"
        name="name"
        placeholder={
          installment ? "Laptop installment" : "Monthly subscription"
        }
        required={false}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="accountId">
            {installment ? "Pay from" : "Payment account"}
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
            defaultValue=""
            id="accountId"
            name="accountId"
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
          <ErrorText message={state.errors?.accountId?.[0]} />
        </div>
        <Field
          error={state.errors?.amount?.[0]}
          inputMode="decimal"
          label={installment ? "Payment amount" : "Recurring amount"}
          name="amount"
          placeholder="0"
        />
      </div>
      {installment ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Payment method</p>
            <div className="mt-2 grid gap-2 rounded-2xl bg-neutral-100 p-1 sm:grid-cols-2">
              <MethodButton
                active={paymentMethod === "external_expense"}
                description="Record an installment expense"
                label="Pay externally"
                onClick={() => setPaymentMethod("external_expense")}
              />
              <MethodButton
                active={paymentMethod === "savings_reimbursement"}
                description="Move money back to savings"
                label="Reimburse savings"
                onClick={() => setPaymentMethod("savings_reimbursement")}
              />
            </div>
          </div>
          {paymentMethod === "savings_reimbursement" ? (
            <div>
              <label
                className="text-sm font-medium"
                htmlFor="destinationAccountId"
              >
                Savings destination
              </label>
              <select
                className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
                defaultValue=""
                id="destinationAccountId"
                name="destinationAccountId"
                required
              >
                <option disabled value="">
                  Choose the savings account
                </option>
                {accounts
                  .filter((account) => account.type === "savings")
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
              </select>
              <ErrorText message={state.errors?.destinationAccountId?.[0]} />
            </div>
          ) : (
            <input name="destinationAccountId" type="hidden" value="" />
          )}
        </div>
      ) : (
        <input name="destinationAccountId" type="hidden" value="" />
      )}
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium" htmlFor="frequency">
            Frequency
          </label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3"
            defaultValue="monthly"
            id="frequency"
            name="frequency"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <Field
          defaultValue={today}
          error={state.errors?.startsOn?.[0]}
          label="Starts"
          name="startsOn"
          type="date"
        />
        <Field
          defaultValue={today}
          error={state.errors?.nextDueOn?.[0]}
          label="Next due"
          name="nextDueOn"
          type="date"
        />
      </div>
      {installment && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            error={state.errors?.installmentCount?.[0]}
            label="Total installments"
            name="installmentCount"
            placeholder="12"
            type="number"
          />
          <Field
            defaultValue="0"
            error={state.errors?.installmentsCompleted?.[0]}
            label="Already completed"
            name="installmentsCompleted"
            type="number"
          />
        </div>
      )}
      {!installment && <input name="installmentCount" type="hidden" value="" />}
      {!installment && (
        <input name="installmentsCompleted" type="hidden" value="" />
      )}
      <div className="rounded-2xl bg-neutral-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">End date</p>
            <p className="mt-1 text-sm text-neutral-400">
              {hasEndDate ? "Stops after this date" : "No end date"}
            </p>
          </div>
          <button
            aria-checked={hasEndDate}
            aria-label="Set an end date"
            className={`relative h-7 w-12 rounded-full transition ${hasEndDate ? "bg-emerald-800" : "bg-neutral-200"}`}
            onClick={() => setHasEndDate((current) => !current)}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all ${hasEndDate ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
        {hasEndDate ? (
          <div className="mt-4 border-t pt-4">
            <Field
              defaultValue={today}
              error={state.errors?.endsOn?.[0]}
              label="Ends on"
              name="endsOn"
              type="date"
            />
          </div>
        ) : (
          <input name="endsOn" type="hidden" value="" />
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
      <div className="flex gap-3 border-t pt-6">
        <button
          className="rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Saving…"
            : installment
              ? "Add installment"
              : "Add subscription"}
        </button>
        <Link
          className="rounded-xl px-5 py-3 text-neutral-600 hover:bg-neutral-100"
          href="/app/recurring"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function MethodButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-xl px-4 py-3 text-left transition ${active ? "bg-white shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-xs text-neutral-400">
        {description}
      </span>
    </button>
  );
}

function Field({
  defaultValue,
  error,
  inputMode,
  label,
  name,
  placeholder,
  required = true,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
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
      <ErrorText message={error} />
    </div>
  );
}
function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="mt-2 text-sm text-red-700">{message}</p>
  ) : null;
}
