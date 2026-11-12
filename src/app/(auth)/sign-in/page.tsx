import { Landmark } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AppearanceSwitcher } from "@/components/appearance/appearance-switcher";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
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
          Welcome back
        </h1>
        <p className="mt-2 text-neutral-600">
          Sign in to your private finance dashboard.
        </p>
        {reset === "success" && (
          <p
            className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            Your password was changed. Sign in with the new one.
          </p>
        )}
        <SignInForm />
      </section>
    </main>
  );
}
