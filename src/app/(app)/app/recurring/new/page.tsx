import { notFound } from "next/navigation";
import { RecurringForm } from "@/components/recurring/recurring-form";
import type { RecurringKind } from "@/domain/recurring/types";
import { requireUser } from "@/lib/auth/require-user";

export default async function NewRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: value } = await searchParams;
  if (value !== "subscription" && value !== "external_installment") notFound();
  const kind: RecurringKind = value;
  await requireUser();
  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-emerald-800">Recurring</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Add {kind === "subscription" ? "subscription" : "installment"}
      </h1>
      <p className="mt-2 text-neutral-500">
        Plan the commitment now. It will not create transactions automatically.
      </p>
      <RecurringForm kind={kind} />
    </section>
  );
}
