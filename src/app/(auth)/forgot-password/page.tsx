import Link from "next/link";
import { Landmark } from "lucide-react";
import { AppearanceSwitcher } from "@/components/appearance/appearance-switcher";
import { RequestPasswordResetForm } from "@/components/auth/request-password-reset-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
          Reset your password
        </h1>
        <p className="mt-2 text-neutral-600">
          We will email you a secure link to choose a new password.
        </p>
        <RequestPasswordResetForm linkError={error === "expired"} />
        <Link
          className="mt-6 inline-block text-sm font-medium text-emerald-800 hover:underline"
          href="/sign-in"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
