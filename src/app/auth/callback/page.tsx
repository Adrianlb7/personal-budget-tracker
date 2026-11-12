"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { getSupabaseConfig } from "@/lib/supabase/config";

function recoveryClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey, {
    isSingleton: false,
    auth: { detectSessionInUrl: false },
  });
}

export default function RecoveryCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finishRecovery = async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const code = query.get("code");
      const hash = fragment.get("token_hash");
      // Supabase may put the flow type in either part of the redirect URL.
      const isRecovery =
        (query.get("type") ?? fragment.get("type")) === "recovery";

      // Remove credentials and one-time codes from the visible URL immediately.
      window.history.replaceState(null, "", "/auth/callback");

      // The email template points here first. A mail scanner can load this page
      // without consuming the one-time token; only the person's click verifies it.
      if (hash && isRecovery) {
        setTokenHash(hash);
        return;
      }

      if ((!accessToken || !refreshToken || !isRecovery) && !code) {
        router.replace("/forgot-password?error=expired");
        return;
      }

      try {
        if (accessToken && refreshToken && isRecovery) {
          // Complete the session on the server so its Set-Cookie headers are
          // committed before the reset page checks for an authenticated user.
          const response = await fetch("/api/auth/recovery-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            cache: "no-store",
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
          });
          if (!response.ok) {
            router.replace("/forgot-password?error=expired");
            return;
          }
        } else {
          const { error } = await recoveryClient().auth.exchangeCodeForSession(
            code!,
          );
          if (error) {
            router.replace("/forgot-password?error=expired");
            return;
          }
        }

        router.replace("/reset-password");
      } catch {
        router.replace("/forgot-password?error=expired");
      }
    };

    void finishRecovery();
  }, [router]);

  const confirmRecovery = async () => {
    if (!tokenHash || pending) return;
    setPending(true);
    setError(null);

    try {
      const supabase = recoveryClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      setTokenHash(null);
      if (verifyError) {
        setError(
          "This recovery link is invalid or expired. Request a new one.",
        );
        return;
      }
      router.replace("/reset-password");
    } catch {
      setTokenHash(null);
      setError("We could not verify this link. Request a new one.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-6">
      {tokenHash ? (
        <section className="w-full max-w-md rounded-[2rem] border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="mt-3 text-neutral-600">
            Confirm that you want to use this link to choose a new password.
          </p>
          <button
            className="mt-6 w-full rounded-xl bg-emerald-900 px-4 py-3 font-medium text-white disabled:opacity-60"
            disabled={pending}
            onClick={confirmRecovery}
            type="button"
          >
            {pending ? "Verifying…" : "Continue to reset password"}
          </button>
        </section>
      ) : error ? (
        <section className="w-full max-w-md rounded-[2rem] border bg-white p-8 text-center shadow-sm">
          <p role="alert">{error}</p>
          <Link
            className="mt-5 inline-block font-medium text-emerald-800 underline"
            href="/forgot-password"
          >
            Request a new link
          </Link>
        </section>
      ) : (
        <p role="status">Verifying your recovery link…</p>
      )}
    </main>
  );
}
