import { signInSchema } from "./validation";

describe("signInSchema", () => {
  it("normalizes valid credentials", () => {
    expect(
      signInSchema.parse({ email: "  owner@example.com ", password: "secret" }),
    ).toEqual({
      email: "owner@example.com",
      password: "secret",
    });
  });

  it("rejects malformed credentials before calling Supabase", () => {
    expect(
      signInSchema.safeParse({ email: "not-an-email", password: "" }).success,
    ).toBe(false);
  });
});
