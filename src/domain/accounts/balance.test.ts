import { calculateAccountBalance, exceedsAvailableBalance } from "./balance";

describe("calculateAccountBalance", () => {
  it("adds inflows and subtracts outflows from the opening balance", () => {
    expect(
      calculateAccountBalance("1000", [
        { amount: "225.75", direction: "inflow" },
        { amount: "100.25", direction: "outflow" },
      ]),
    ).toBe("1125.5");
  });

  it("preserves decimal precision without JavaScript floating-point math", () => {
    expect(
      calculateAccountBalance("0.1", [{ amount: "0.2", direction: "inflow" }]),
    ).toBe("0.3");
  });

  it("supports negative liability balances", () => {
    expect(
      calculateAccountBalance("-600", [
        { amount: "100", direction: "inflow" },
        { amount: "25", direction: "outflow" },
      ]),
    ).toBe("-525");
  });
});

describe("available balance", () => {
  it("rejects an outflow above the exact balance", () => {
    expect(exceedsAvailableBalance("1000.000001", "1000")).toBe(true);
  });
  it("allows spending the full balance", () => {
    expect(exceedsAvailableBalance("1000", "1000")).toBe(false);
  });
  it("accepts comma decimal input", () => {
    expect(exceedsAvailableBalance("10,25", "10.20")).toBe(true);
  });
});
