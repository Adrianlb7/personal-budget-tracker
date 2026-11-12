import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const request = (
  origin = "http://localhost:3000",
  password = "new-password-123",
) =>
  new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "localhost:3000",
    },
    body: JSON.stringify({ password }),
  });

describe("password reset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the authenticated user's password and signs out", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: { updateUser, signOut },
    } as never);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(updateUser).toHaveBeenCalledWith({ password: "new-password-123" });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects cross-origin requests before reading the session", async () => {
    expect((await POST(request("https://other.example"))).status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns a useful Supabase error", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        updateUser: vi.fn().mockResolvedValue({
          error: { code: "weak_password", message: "Password is too weak." },
        }),
      },
    } as never);

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      code: "weak_password",
      message: "Password is too weak.",
    });
  });

  it("still reports success if sign-out fails after the password changed", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        updateUser: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockRejectedValue(new Error("network unavailable")),
      },
    } as never);

    expect((await POST(request())).status).toBe(200);
  });
});
