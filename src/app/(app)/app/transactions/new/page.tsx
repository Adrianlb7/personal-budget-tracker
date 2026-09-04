import { notFound } from "next/navigation";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransferForm } from "@/components/transactions/transfer-form";
import type { Account } from "@/domain/accounts/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: value } = await searchParams;
  if (value !== "income" && value !== "expense" && value !== "transfer")
    notFound();
  const type = value;
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("account_details")
      .select(
        "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("name"),
    type === "transfer"
      ? Promise.resolve({ data: [] })
      : supabase
          .from("categories")
          .select("name")
          .eq("user_id", user.id)
          .eq("kind", type)
          .is("archived_at", null)
          .order("name"),
  ]);

  return (
    <section>
      <p className="text-sm font-medium text-emerald-800">Transactions</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Add {type}</h1>
      <p className="mt-2 text-neutral-600">
        Record the original amount and account currency.
      </p>
      {accounts?.length ? (
        type === "transfer" ? (
          accounts.length >= 2 ? (
            <TransferForm accounts={accounts as Account[]} />
          ) : (
            <p className="mt-8 rounded-2xl border bg-white p-6">
              Create at least two active accounts before adding a transfer.
            </p>
          )
        ) : (
          <TransactionForm
            accounts={accounts as Account[]}
            categories={(categories ?? []).map((item) => item.name)}
            type={type}
          />
        )
      ) : (
        <p className="mt-8 rounded-2xl border bg-white p-6">
          Create an active account before adding transactions.
        </p>
      )}
    </section>
  );
}
