import { notFound } from "next/navigation";
import { RecurringForm } from "@/components/recurring/recurring-form";
import type { Account } from "@/domain/accounts/types";
import type { RecurringKind } from "@/domain/recurring/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function NewRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: value } = await searchParams;
  if (value !== "subscription" && value !== "external_installment") notFound();
  const kind: RecurringKind = value;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("account_details")
    .select(
      "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
    )
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("name");
  if (error) throw new Error("Accounts could not be loaded.");
  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-emerald-800">Recurring</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Add {kind === "subscription" ? "subscription" : "installment"}
      </h1>
      <p className="mt-2 text-neutral-500">
        Plan the commitment now. It will not create transactions automatically.
      </p>
      {accounts?.length ? (
        <RecurringForm accounts={accounts as Account[]} kind={kind} />
      ) : (
        <p className="mt-8 rounded-2xl border bg-white p-6">
          Create an active account first.
        </p>
      )}
    </section>
  );
}
