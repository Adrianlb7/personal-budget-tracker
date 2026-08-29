import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

export const decimal = (value: Decimal.Value) => new Decimal(value);
