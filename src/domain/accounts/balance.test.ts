import { calculateAccountBalance } from "./balance";

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
