"use client";

import { useState, type FormEvent } from "react";
import { recoveryRequestErrorMessage } from "@/lib/auth/recovery-errors";

export function RequestPasswordResetForm({
  linkError = false,
}: {
  linkError?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiredLink, setExpiredLink] = useState(linkError);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setExpiredLink(false);
    if (window.location.search)
      window.history.replaceState(null, "", "/forgot-password");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const result: { ok?: boolean; code?: string; status?: number } =
        await response.json();
      if (!response.ok || !result.ok) {
        setError(
          recoveryRequestErrorMessage({
            code: result.code ?? "server_connection_error",
            status: result.status ?? response.status,
          }),
        );
        return;
      }
      setSent(true);
    } catch {
      setError(
        "The browser could not reach Orba's local server. Reload this page and try again.",
      );
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <p
        className="mt-8 rounded-2xl border bg-emerald-50 p-4 text-sm text-emerald-900"
        role="status"
      >
        If an account uses that email, you will receive a recovery link. Check
        your inbox and spam folder.
      </p>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      {expiredLink && (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          That link is invalid or expired. Request a new one below.
        </p>
      )}
      <div>
        <label className="text-sm font-medium" htmlFor="recovery-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border bg-white px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="recovery-email"
          name="email"
          required
          type="email"
        />
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending…" : "Send recovery email"}
      </button>
    </form>
  );
}
