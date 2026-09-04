import Link from "next/link";
import {
  CreditCard,
  Landmark,
  PiggyBank,
  RotateCcw,
  Trash2,
  WalletCards,
} from "lucide-react";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { deleteAccount, restoreAccount } from "@/domain/accounts/actions";
import { calculateAccountBalance } from "@/domain/accounts/balance";
import {
  accountTypeLabels,
  type Account,
  type AccountType,
} from "@/domain/accounts/types";
import { formatMoney } from "@/lib/money/format";
import { ArchiveAccountButton } from "./archive-account-button";

const icons = {
  cash: WalletCards,
  checking: Landmark,
  savings: PiggyBank,
  investment: Landmark,
  credit_debt: CreditCard,
} satisfies Record<AccountType, typeof Landmark>;

export function AccountCard({ account }: { account: Account }) {
  const Icon = icons[account.type];
  const balance =
    account.current_balance ??
    calculateAccountBalance(account.opening_balance, []);

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{account.name}</h2>
            <p className="text-sm text-neutral-500">
              {accountTypeLabels[account.type]} · {account.currency}
            </p>
          </div>
        </div>
        {account.archived_at && (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
            Archived
          </span>
        )}
      </div>

      <p className="mt-6 text-2xl font-semibold tracking-tight">
        {formatMoney(balance, account.currency)}
      </p>
      <p className="mt-1 text-xs text-neutral-500">Current balance</p>

      <div className="mt-5 flex items-center gap-1 border-t pt-3">
        <Link
          className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          href={`/app/accounts/${account.id}/edit`}
        >
          Edit
        </Link>
        {!account.archived_at && (
          <ArchiveAccountButton accountId={account.id} />
        )}
        {account.archived_at && (
          <>
            <form action={restoreAccount.bind(null, account.id)}>
              <button
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                type="submit"
              >
                <RotateCcw aria-hidden="true" className="size-4" /> Restore
              </button>
            </form>
            <ConfirmActionButton
              action={deleteAccount.bind(null, account.id)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              confirmation={`Permanently delete ${account.name}? This only works if it has no transaction history.`}
            >
              <Trash2 aria-hidden="true" className="size-4" /> Delete
            </ConfirmActionButton>
          </>
        )}
      </div>
    </article>
  );
}
