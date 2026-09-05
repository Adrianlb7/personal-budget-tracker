import { decimal } from "@/lib/money/decimal";

export function convertClpToUsd(clpAmount: string, clpPerUsd: string) {
  const rate = decimal(clpPerUsd);
  if (!rate.greaterThan(0))
    throw new Error("The exchange rate must be positive.");
  return decimal(clpAmount).dividedBy(rate).toDecimalPlaces(6).toFixed();
}

export function calculateBtcUsdValue(btcAmount: string, usdPrice: string) {
  return decimal(btcAmount).times(usdPrice).toFixed();
}
