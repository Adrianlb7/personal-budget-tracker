import { recurringNameOrDefault, recurringSchema } from "./validation";

const valid = {
  accountId: "33333333-3333-4333-8333-333333333333",
  amount: "19,99",
  destinationAccountId: "",
  endsOn: "",
  frequency: "monthly",
  installmentCount: "",
  installmentsCompleted: "",
  kind: "subscription",
  name: "Monthly subscription",
  nextDueOn: "2026-10-01",
  paymentMethod: "external_expense",
  startsOn: "2026-09-01",
};

describe("recurringSchema", () => {
  it("normalizes money and supplies the placeholder name", () => {
    const result = recurringSchema.parse(valid);
    expect(result.amount).toBe("19.99");
    expect(result.name).toBe("Monthly subscription");
  });
  it("uses the correct placeholder name for each kind", () => {
    expect(recurringNameOrDefault("", "subscription")).toBe(
      "Monthly subscription",
    );
    expect(recurringNameOrDefault("", "external_installment")).toBe(
      "Laptop installment",
    );
  });
  it("validates installment progress", () => {
    expect(
      recurringSchema.safeParse({
        ...valid,
        kind: "external_installment",
        destinationAccountId: "44444444-4444-4444-8444-444444444444",
        installmentCount: "6",
        installmentsCompleted: "7",
      }).success,
    ).toBe(false);
  });
  it("only requires savings for a reimbursement installment", () => {
    const installment = {
      ...valid,
      kind: "external_installment",
      installmentCount: "6",
      installmentsCompleted: "0",
    };
    expect(recurringSchema.safeParse(installment).success).toBe(true);
    expect(
      recurringSchema.safeParse({
        ...installment,
        paymentMethod: "savings_reimbursement",
      }).success,
    ).toBe(false);
  });
});
