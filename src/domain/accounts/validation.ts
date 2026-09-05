import { z } from "zod";
import { decimal } from "@/lib/money/decimal";
import { accountTypes, currencies } from "./types";

const moneyPattern = /^-?\d+(?:[.,]\d{1,8})?$/;

export const normalizeMoneyInput = (value: string) =>
  value.trim().replace(",", ".");

const moneyInputSchema = z
  .string()
  .trim()
  .regex(moneyPattern, "Enter a number with up to 8 decimal places.")
  .transform(normalizeMoneyInput)
  .refine(
    (value) => decimal(value).abs().lessThan("100000000000000"),
    "Amount is too large.",
  );

export const accountSchema = z.object({
  currency: z.enum(currencies),
  name: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? "Main checking"
        : value,
    z
      .string()
      .trim()
      .min(1, "Enter an account name.")
      .max(80, "Use 80 characters or fewer."),
  ),
  openingBalance: moneyInputSchema,
  type: z.enum(accountTypes),
});

export type AccountFormState = {
  errors?: {
    currency?: string[];
    name?: string[];
    openingBalance?: string[];
    type?: string[];
  };
  message?: string;
};
