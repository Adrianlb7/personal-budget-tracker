import { getAuthRedirect } from "./routes";

describe("getAuthRedirect", () => {
  it("redirects signed-out visitors away from app routes", () => {
    expect(getAuthRedirect("/app/accounts", false)).toBe(
      "/sign-in?next=%2Fapp%2Faccounts",
    );
  });

  it("allows authenticated visitors into app routes", () => {
    expect(getAuthRedirect("/app", true)).toBeNull();
  });

  it("redirects authenticated visitors away from sign-in", () => {
    expect(getAuthRedirect("/sign-in", true)).toBe("/app");
  });
});
