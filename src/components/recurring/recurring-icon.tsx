import Image from "next/image";
import { CreditCard, ReceiptText } from "lucide-react";
import type { RecurringCommitment } from "@/domain/recurring/types";

type IconItem = Pick<
  RecurringCommitment,
  "id" | "kind" | "icon_emoji" | "icon_image_path"
>;

export function RecurringIcon({
  item,
  variant = "card",
}: {
  item: IconItem;
  variant?: "card" | "badge" | "dashboard";
}) {
  const size = variant === "card" ? 44 : variant === "dashboard" ? 32 : 16;
  const box =
    variant === "card"
      ? "size-11 rounded-2xl"
      : variant === "dashboard"
        ? "size-8 rounded-xl"
        : "size-4";

  if (item.icon_image_path) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center ${box}`}
      >
        <Image
          alt=""
          className="size-full object-contain"
          height={size}
          src={`/api/item-icons/recurring/${item.id}?v=${encodeURIComponent(item.icon_image_path)}`}
          unoptimized
          width={size}
        />
      </span>
    );
  }

  if (item.icon_emoji) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center bg-[var(--surface-soft)] leading-none ${box} ${variant === "card" ? "text-[1.8rem]" : variant === "dashboard" ? "text-xl" : "text-base"}`}
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        }}
      >
        {item.icon_emoji}
      </span>
    );
  }

  const DefaultIcon = item.kind === "subscription" ? CreditCard : ReceiptText;
  if (variant === "badge") {
    return <DefaultIcon aria-hidden="true" size={15} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-emerald-50 text-emerald-800 ${box}`}
    >
      <DefaultIcon className={variant === "card" ? "size-5" : "size-4"} />
    </span>
  );
}
