import { z } from "zod";
import { decimal } from "@/lib/money/decimal";
import { normalizeMoneyInput } from "@/domain/accounts/validation";

const amountPattern = /^\d+(?:[.,]\d{1,6})?$/;
const optionalDate = z.union([z.literal(""), z.iso.date()]);

export function recurringNameOrDefault(
  value: FormDataEntryValue | null,
  kind: FormDataEntryValue | null,
) {
  if (typeof value === "string" && value.trim() !== "") return value;
  return kind === "external_installment"
    ? "Laptop installment"
    : "Monthly subscription";
}

export const recurringSchema = z
  .object({
    accountId: z.uuid("Choose an account."),
    amount: z
      .string()
      .trim()
      .regex(amountPattern, "Enter a positive amount with up to 6 decimals.")
      .transform(normalizeMoneyInput)
      .refine(
        (value) => decimal(value).greaterThan(0),
        "Amount must be greater than zero.",
      ),
    endsOn: optionalDate,
    destinationAccountId: z.union([z.literal(""), z.uuid()]),
    frequency: z.enum(["weekly", "monthly", "yearly"]),
    installmentCount: z.string(),
    installmentsCompleted: z.string(),
    kind: z.enum(["subscription", "external_installment"]),
    name: z.string().trim().min(1).max(120),
    nextDueOn: z.iso.date("Enter the next due date."),
    paymentMethod: z.enum(["external_expense", "savings_reimbursement"]),
    startsOn: z.iso.date("Enter a start date."),
  })
  .superRefine((value, context) => {
    if (value.endsOn && value.endsOn < value.startsOn)
      context.addIssue({
        code: "custom",
        message: "End date must follow the start date.",
        path: ["endsOn"],
      });
    if (value.kind === "external_installment") {
      if (
        value.paymentMethod === "savings_reimbursement" &&
        !value.destinationAccountId
      )
        context.addIssue({
          code: "custom",
          message: "Choose the savings destination.",
          path: ["destinationAccountId"],
        });
      if (
        value.paymentMethod === "savings_reimbursement" &&
        value.destinationAccountId === value.accountId
      )
        context.addIssue({
          code: "custom",
          message: "Choose two different accounts.",
          path: ["destinationAccountId"],
        });
      const total = Number(value.installmentCount);
      const completed = Number(value.installmentsCompleted);
      if (!Number.isInteger(total) || total < 1)
        context.addIssue({
          code: "custom",
          message: "Enter the total number of installments.",
          path: ["installmentCount"],
        });
      if (!Number.isInteger(completed) || completed < 0 || completed > total)
        context.addIssue({
          code: "custom",
          message: "Enter a valid completed count.",
          path: ["installmentsCompleted"],
        });
    }
  })
  .transform((value) => ({
    ...value,
    destinationAccountId:
      value.kind === "external_installment" &&
      value.paymentMethod === "savings_reimbursement"
        ? value.destinationAccountId
        : null,
    installmentCount:
      value.kind === "external_installment"
        ? Number(value.installmentCount)
        : null,
    installmentsCompleted:
      value.kind === "external_installment"
        ? Number(value.installmentsCompleted)
        : null,
  }));

export type RecurringFormState = {
  errors?: Partial<Record<keyof z.input<typeof recurringSchema>, string[]>>;
  message?: string;
};
