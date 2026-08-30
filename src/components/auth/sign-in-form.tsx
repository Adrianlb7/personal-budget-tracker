"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          aria-describedby="email-error"
          autoComplete="email"
          className="mt-2 w-full rounded-xl border bg-white px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="email"
          name="email"
          required
          type="email"
        />
        {state.errors?.email && (
          <p className="mt-2 text-sm text-red-700" id="email-error">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby="password-error"
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border bg-white px-4 py-3 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="password"
          name="password"
          required
          type="password"
        />
        {state.errors?.password && (
          <p className="mt-2 text-sm text-red-700" id="password-error">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {state.message && (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}

      <button
        className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
