"use client";

import { useActionState } from "react";
import { CircleDollarSign } from "lucide-react";
import {
  payRecurringCommitment,
  type PayRecurringState,
} from "@/domain/recurring/actions";

const initialState: PayRecurringState = {};

export function PayButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    payRecurringCommitment.bind(null, id),
    initialState,
  );

  return (
    <div>
      <form action={action}>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          <CircleDollarSign className="size-4" />
          {pending ? "Paying…" : "Pay"}
        </button>
      </form>
      {state.message && (
        <p className="mt-2 max-w-64 text-xs text-red-700" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
