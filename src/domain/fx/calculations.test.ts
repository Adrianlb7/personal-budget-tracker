import { calculateBtcUsdValue, convertClpToUsd } from "./calculations";

describe("FX calculations", () => {
  it("divides CLP by the bank's CLP-per-USD rate exactly", () => {
    expect(convertClpToUsd("1000000", "910")).toBe("1098.901099");
  });

  it("values BTC without JavaScript floating point", () => {
    expect(calculateBtcUsdValue("0.12345678", "100000")).toBe("12345.678");
  });

  it("rejects a zero bank rate", () => {
    expect(() => convertClpToUsd("1000000", "0")).toThrow();
  });
});
