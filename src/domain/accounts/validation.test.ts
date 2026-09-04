import { accountSchema } from "./validation";

describe("accountSchema", () => {
  it("accepts a signed decimal string and normalizes the name", () => {
    expect(
      accountSchema.parse({
        currency: "USD",
        name: "  Main checking  ",
        openingBalance: "-100.250000",
        type: "checking",
      }),
    ).toEqual({
      currency: "USD",
      name: "Main checking",
      openingBalance: "-100.250000",
      type: "checking",
    });
  });

  it("rejects unsupported account types and imprecise amounts", () => {
    expect(
      accountSchema.safeParse({
        currency: "USD",
        name: "Brokerage",
        openingBalance: "0.0000001",
        type: "crypto",
      }).success,
    ).toBe(false);
  });

  it.each([
    ["1000.25", "1000.25"],
    ["1000,25", "1000.25"],
    ["-600,50", "-600.50"],
  ])("accepts %s and normalizes it to %s", (input, expected) => {
    const result = accountSchema.parse({
      currency: "USD",
      name: "Account",
      openingBalance: input,
      type: "checking",
    });

    expect(result.openingBalance).toBe(expected);
  });

  it.each(["1,000.25", "1.000,25", "1000,", "not money"])(
    "rejects malformed value %s without throwing",
    (openingBalance) => {
      const parse = () =>
        accountSchema.safeParse({
          currency: "USD",
          name: "Account",
          openingBalance,
          type: "checking",
        });

      expect(parse).not.toThrow();
      expect(parse().success).toBe(false);
    },
  );
});
