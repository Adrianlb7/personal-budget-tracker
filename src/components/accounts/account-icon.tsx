import Image from "next/image";
import {
  ArrowUpRight,
  CreditCard,
  Landmark,
  PiggyBank,
  WalletCards,
} from "lucide-react";
import type { Account } from "@/domain/accounts/types";

type IconAccount = Pick<
  Account,
  "id" | "type" | "icon_emoji" | "icon_image_path"
>;

export function AccountIcon({
  account,
  variant = "card",
}: {
  account: IconAccount;
  variant?: "card" | "dashboard";
}) {
  const corner = variant === "dashboard" ? "rounded-2xl" : "rounded-xl";
  if (account.icon_image_path) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center">
        <Image
          alt=""
          aria-hidden="true"
          className="size-10 object-contain"
          height={40}
          src={`/api/account-icons/${account.id}?v=${encodeURIComponent(account.icon_image_path)}`}
          unoptimized
          width={40}
        />
      </span>
    );
  }

  if (account.icon_emoji) {
    return (
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center bg-[var(--surface-soft)] text-[1.8rem] leading-none ${corner}`}
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        }}
      >
        {account.icon_emoji}
      </span>
    );
  }

  const Icon =
    variant === "dashboard"
      ? account.type === "investment"
        ? ArrowUpRight
        : Landmark
      : account.type === "cash"
        ? WalletCards
        : account.type === "savings"
          ? PiggyBank
          : account.type === "credit_debt"
            ? CreditCard
            : Landmark;

  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center ${corner} ${account.type === "investment" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-800"}`}
    >
      <Icon className={variant === "dashboard" ? "size-4" : "size-5"} />
    </span>
  );
}
