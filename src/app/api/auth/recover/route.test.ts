import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({
    url: "https://example.supabase.co",
    anonKey: "public-key",
  }),
}));

function request(body: unknown) {
  return new Request("http://127.0.0.1:3000/api/auth/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("password recovery request route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid email without contacting Supabase", async () => {
    const response = await POST(request({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requests a recovery link for this app's callback", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createClient).mockReturnValue({
      auth: { resetPasswordForEmail },
    } as never);

    const response = await POST(request({ email: "owner@example.com" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "public-key",
      {
        auth: {
          flowType: "implicit",
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
      redirectTo: "http://127.0.0.1:3000/auth/callback",
    });
  });

  it("returns Supabase's non-identifying error code", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({
          error: { code: "email_address_not_authorized", status: 403 },
        }),
      },
    } as never);

    const response = await POST(request({ email: "owner@example.com" }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      code: "email_address_not_authorized",
      status: 403,
    });
  });
});
