import { parseAppearance, resolveAppearance } from "./theme";

describe("appearance preference", () => {
  it("defaults invalid or missing preferences to system", () => {
    expect(parseAppearance(null)).toBe("system");
    expect(parseAppearance("unknown")).toBe("system");
  });

  it("honors explicit choices and follows the OS in system mode", () => {
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
  });
});
