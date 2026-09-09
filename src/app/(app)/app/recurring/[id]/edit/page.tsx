import { notFound } from "next/navigation";
import { RecurringForm } from "@/components/recurring/recurring-form";
import type { RecurringCommitment } from "@/domain/recurring/types";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_commitments")
    .select(
      "id,user_id,kind,name,account_id,destination_account_id,payment_method,amount,currency,frequency,starts_on,next_due_on,ends_on,installment_count,installments_completed,status,created_at,updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) notFound();
  const commitment = data as RecurringCommitment;
  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-emerald-800">Recurring</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Edit{" "}
        {commitment.kind === "subscription" ? "subscription" : "installment"}
      </h1>
      <p className="mt-2 text-neutral-500">
        Update the schedule and details without losing recorded payments.
      </p>
      <RecurringForm commitment={commitment} kind={commitment.kind} />
    </section>
  );
}
