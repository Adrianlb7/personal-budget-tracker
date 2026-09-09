import { notFound } from "next/navigation";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransferForm } from "@/components/transactions/transfer-form";
import type { Account } from "@/domain/accounts/types";
import { categoryOptions } from "@/domain/categories/catalog";
import type { TransactionDetail } from "@/domain/transactions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data, error }, { data: accounts }, { data: categories }] =
    await Promise.all([
      supabase
        .from("transaction_details")
        .select(
          "id,user_id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("account_details")
        .select(
          "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
        )
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("categories")
        .select("name,kind")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("name"),
    ]);
  if (error || !data) notFound();
  const transaction = data as TransactionDetail;
  const usableAccounts = ((accounts ?? []) as Account[]).filter(
    (account) => account.currency !== "BTC",
  );
  const transactionAccounts = usableAccounts.filter(
    (account) => account.currency === "USD",
  );
  return (
    <section>
      <p className="text-sm font-medium text-emerald-800">Transactions</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Edit {transaction.type}
      </h1>
      <p className="mt-2 text-neutral-600">
        Changes update the affected account balances automatically.
      </p>
      {transaction.type === "transfer" ? (
        <TransferForm accounts={usableAccounts} transaction={transaction} />
      ) : (
        <TransactionForm
          accounts={transactionAccounts}
          categories={categoryOptions(
            transaction.type,
            (categories ?? [])
              .filter((item) => item.kind === transaction.type)
              .map((item) => item.name),
          )}
          transaction={transaction}
          type={transaction.type}
        />
      )}
    </section>
  );
}
