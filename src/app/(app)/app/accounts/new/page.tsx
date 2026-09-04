import { AccountForm } from "@/components/accounts/account-form";
import { createAccount } from "@/domain/accounts/actions";

export default function NewAccountPage() {
  return (
    <section>
      <p className="text-sm font-medium text-emerald-800">Accounts</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Add account
      </h1>
      <p className="mt-2 text-neutral-600">
        Record where the money is held and its starting balance.
      </p>
      <AccountForm action={createAccount} />
    </section>
  );
}
