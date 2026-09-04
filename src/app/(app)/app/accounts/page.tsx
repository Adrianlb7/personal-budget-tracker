import Link from "next/link";
import { Plus } from "lucide-react";
import { AccountCard } from "@/components/accounts/account-card";
import type { Account } from "@/domain/accounts/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const user = await requireUser();
  const supabase = await createClient();
  let query = supabase
    .from("account_details")
    .select(
      "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  query = showArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);
  const { data, error } = await query;

  if (error) {
    throw new Error("Accounts could not be loaded.");
  }

  const accounts = (data ?? []) as Account[];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Your money locations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Accounts
          </h1>
          <p className="mt-2 text-neutral-600">
            Balances start with an opening value and remain explainable through
            financial movements.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          href="/app/accounts/new"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add account
        </Link>
      </div>

      <div className="mt-8 flex gap-2 border-b">
        <ViewLink active={!showArchived} href="/app/accounts" label="Active" />
        <ViewLink
          active={showArchived}
          href="/app/accounts?archived=1"
          label="Archived"
        />
      </div>

      {accounts.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard account={account} key={account.id} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">
            {showArchived ? "No archived accounts" : "Add your first account"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-500">
            {showArchived
              ? "Accounts you archive will remain available here for financial history."
              : "Start with the checking, cash, or savings account you use most often."}
          </p>
        </div>
      )}
    </section>
  );
}

function ViewLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={`border-b-2 px-4 py-3 text-sm font-medium ${active ? "border-emerald-800 text-emerald-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}
      href={href}
    >
      {label}
    </Link>
  );
}
