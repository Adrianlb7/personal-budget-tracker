import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const request = (origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/auth/recovery-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "localhost:3000",
    },
    body: JSON.stringify({ access_token: "access", refresh_token: "refresh" }),
  });

describe("recovery session handoff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets the Supabase session before approving the reset page", async () => {
    const setSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: "access" } },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { setSession },
    } as never);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
  });

  it("rejects a cross-origin session handoff", async () => {
    const response = await POST(request("https://other.example"));

    expect(response.status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("accepts the browser host even when Next.js normalized request.url", async () => {
    const setSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: "access" } },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { setSession },
    } as never);
    const browserRequest = new Request(
      "http://localhost:3000/api/auth/recovery-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:3000",
          Host: "127.0.0.1:3000",
        },
        body: JSON.stringify({
          access_token: "access",
          refresh_token: "refresh",
        }),
      },
    );

    expect((await POST(browserRequest)).status).toBe(200);
  });

  it("rejects an invalid session", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        setSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { code: "invalid_token" },
        }),
      },
    } as never);

    const response = await POST(request());

    expect(response.status).toBe(401);
  });
});
