"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ password }),
      });
      const result: { ok?: boolean; code?: string; message?: string } =
        await response.json();
      if (!response.ok || !result.ok) {
        setError(
          response.status === 401
            ? "Your recovery session has expired. Request a new link."
            : (result.message ??
                "The password could not be changed. Please try again."),
        );
        return;
      }
      router.replace("/sign-in?reset=success");
    } catch {
      setError(
        "Orba could not reach the password service. Please try again on this page.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <div>
        <label className="text-sm font-medium" htmlFor="new-password">
          New password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border bg-white px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="new-password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border bg-white px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="confirm-password"
          minLength={8}
          name="confirmation"
          required
          type="password"
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
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
