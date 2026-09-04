import { z } from "zod";
import { decimal } from "@/lib/money/decimal";
import { normalizeMoneyInput } from "@/domain/accounts/validation";

const amountPattern = /^\d+(?:[.,]\d{1,6})?$/;

export const transferSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .regex(amountPattern, "Enter a positive amount with up to 6 decimals.")
      .transform(normalizeMoneyInput)
      .refine(
        (value) => decimal(value).greaterThan(0),
        "Amount must be greater than zero.",
      )
      .refine(
        (value) => decimal(value).lessThan("100000000000000"),
        "Amount is too large.",
      ),
    date: z.iso.date("Enter a valid date."),
    description: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === ""
          ? "Move to savings"
          : value,
      z
        .string()
        .trim()
        .min(1, "Enter a description.")
        .max(160, "Use 160 characters or fewer."),
    ),
    destinationAccountId: z.uuid("Choose a destination account."),
    notes: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
    sourceAccountId: z.uuid("Choose a source account."),
  })
  .refine((value) => value.sourceAccountId !== value.destinationAccountId, {
    message: "Choose two different accounts.",
    path: ["destinationAccountId"],
  });

export type TransferFormState = {
  errors?: Partial<Record<keyof z.input<typeof transferSchema>, string[]>>;
  message?: string;
};
