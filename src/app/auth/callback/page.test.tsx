import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import RecoveryCallbackPage from "./page";

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({
    url: "https://example.supabase.co",
    anonKey: "public-key",
  }),
}));

describe("password recovery callback", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace } as never);
    window.history.replaceState(null, "", "/auth/callback");
  });

  it("hands an implicit recovery session to the server and removes tokens from the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(
      null,
      "",
      "/auth/callback#access_token=access&refresh_token=refresh&type=recovery",
    );

    render(<RecoveryCallbackPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/reset-password"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/recovery-session",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          access_token: "access",
          refresh_token: "refresh",
        }),
      }),
    );
    expect(window.location.hash).toBe("");
  });

  it("rejects links that are not recovery links", async () => {
    window.history.replaceState(
      null,
      "",
      "/auth/callback#access_token=access&refresh_token=refresh&type=signup",
    );

    render(<RecoveryCallbackPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/forgot-password?error=expired"),
    );
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("accepts a recovery type supplied in the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(
      null,
      "",
      "/auth/callback?type=recovery#access_token=access&refresh_token=refresh",
    );

    render(<RecoveryCallbackPage />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/reset-password"),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("waits for a click before consuming a token hash", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createBrowserClient).mockReturnValue({
      auth: { verifyOtp },
    } as never);
    window.history.replaceState(
      null,
      "",
      "/auth/callback#token_hash=one-time-hash&type=recovery",
    );

    render(<RecoveryCallbackPage />);

    const button = await screen.findByRole("button", {
      name: "Continue to reset password",
    });
    expect(window.location.hash).toBe("");
    expect(verifyOtp).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/reset-password"),
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "one-time-hash",
      type: "recovery",
    });
  });

  afterEach(() => vi.unstubAllGlobals());
});
