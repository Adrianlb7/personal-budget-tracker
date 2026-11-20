import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  RefreshCw,
  Repeat2,
} from "lucide-react";
import type { TransactionDetail } from "@/domain/transactions/types";

type IconTransaction = Pick<
  TransactionDetail,
  "id" | "type" | "icon_emoji" | "icon_image_path"
> & { metadata?: TransactionDetail["metadata"] };

export function TransactionIcon({
  transaction,
  variant = "list",
}: {
  transaction: IconTransaction;
  variant?: "list" | "dashboard";
}) {
  const compact = variant === "dashboard";
  const size = compact ? "size-9" : "size-10";

  if (transaction.icon_image_path) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${size} shrink-0 items-center justify-center`}
      >
        <Image
          alt=""
          className={`${size} object-contain`}
          height={compact ? 36 : 40}
          src={`/api/item-icons/transactions/${transaction.id}?v=${encodeURIComponent(transaction.icon_image_path)}`}
          unoptimized
          width={compact ? 36 : 40}
        />
      </span>
    );
  }

  if (transaction.icon_emoji) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[1.7rem] leading-none`}
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        }}
      >
        {transaction.icon_emoji}
      </span>
    );
  }

  if (compact) {
    const Icon =
      transaction.type === "transfer"
        ? ArrowRight
        : transaction.type === "income"
          ? ArrowDownLeft
          : ArrowUpRight;
    return (
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100"
      >
        <Icon
          className={`size-4 ${transaction.type === "income" ? "text-emerald-700" : transaction.type === "expense" ? "text-red-600" : ""}`}
        />
      </span>
    );
  }

  const installment = transaction.metadata?.recurring_kind === "installment";
  const subscription = transaction.metadata?.recurring_kind === "subscription";
  const Icon = installment
    ? Repeat2
    : subscription
      ? RefreshCw
      : transaction.type === "transfer"
        ? ArrowRightLeft
        : transaction.type === "income"
          ? ArrowDownLeft
          : ArrowUpRight;
  const tone = installment
    ? "bg-violet-50 text-violet-700"
    : subscription
      ? "bg-amber-50 text-amber-700"
      : transaction.type === "transfer"
        ? "bg-blue-50 text-blue-700"
        : transaction.type === "income"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700";
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      <Icon className="size-5" />
    </span>
  );
}
