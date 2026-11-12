import Link from "next/link";
import { Landmark } from "lucide-react";
import { AppearanceSwitcher } from "@/components/appearance/appearance-switcher";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const hasSession = Boolean(data?.claims.sub);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="absolute top-6 right-6 w-48">
        <AppearanceSwitcher />
      </div>
      <section className="w-full max-w-md rounded-[2rem] border bg-white p-8 shadow-[0_24px_65px_-42px_rgba(18,54,43,0.35)] sm:p-10">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-900 text-white">
          <Landmark aria-hidden="true" className="size-5" />
        </div>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        {hasSession ? (
          <>
            <p className="mt-2 text-neutral-600">
              Enter a new password for your Orba account.
            </p>
            <UpdatePasswordForm />
          </>
        ) : (
          <>
            <p className="mt-2 text-neutral-600">
              This recovery link is invalid or has expired.
            </p>
            <Link
              className="mt-6 inline-block text-sm font-medium text-emerald-800 hover:underline"
              href="/forgot-password"
            >
              Request a new link
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
