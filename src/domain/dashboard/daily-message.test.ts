import { DAILY_MONEY_MESSAGES, dailyMoneyMessage } from "./daily-message";

describe("daily money message", () => {
  it("stays stable throughout the same UTC day", () => {
    expect(dailyMoneyMessage(new Date("2026-09-04T00:01:00Z"))).toBe(
      dailyMoneyMessage(new Date("2026-09-04T23:59:00Z")),
    );
  });

  it("cycles through all 30 messages", () => {
    const start = new Date("2026-09-04T12:00:00Z");
    const afterCycle = new Date(start.getTime() + 30 * 86_400_000);
    expect(DAILY_MONEY_MESSAGES).toHaveLength(30);
    expect(dailyMoneyMessage(afterCycle)).toBe(dailyMoneyMessage(start));
  });
});
