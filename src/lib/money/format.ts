import type { Currency } from "@/domain/accounts/types";

export function formatMoney(amount: string, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
    minimumFractionDigits: currency === "CLP" ? 0 : 2,
    style: "currency",
  }).format(Number(amount));
}
