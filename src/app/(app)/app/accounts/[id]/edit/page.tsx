import { notFound } from "next/navigation";
import { AccountForm } from "@/components/accounts/account-form";
import { updateAccount } from "@/domain/accounts/actions";
import type { Account } from "@/domain/accounts/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_details")
    .select(
      "id,user_id,name,type,currency,opening_balance,archived_at,created_at,updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const action = updateAccount.bind(null, id);

  return (
    <section>
      <p className="text-sm font-medium text-emerald-800">Accounts</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Edit account
      </h1>
      <p className="mt-2 text-neutral-600">
        Update account details without losing its history.
      </p>
      <AccountForm account={data as Account} action={action} />
    </section>
  );
}
