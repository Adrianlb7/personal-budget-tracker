import { decimal } from "./decimal";

describe("decimal", () => {
  it("does not inherit binary floating-point errors", () => {
    expect(decimal("0.1").plus("0.2").toString()).toBe("0.3");
  });
});
