import { recoveryRequestErrorMessage } from "./recovery-errors";

describe("recovery request errors", () => {
  it("explains Supabase's default mailer restriction", () => {
    expect(
      recoveryRequestErrorMessage({
        code: "email_address_not_authorized",
        status: 403,
      }),
    ).toContain("default mailer");
  });

  it("identifies a mail sending limit without exposing account existence", () => {
    const message = recoveryRequestErrorMessage({
      code: "over_email_send_rate_limit",
      status: 429,
    });
    expect(message).toContain("limit");
    expect(message).not.toContain("account");
  });
});
