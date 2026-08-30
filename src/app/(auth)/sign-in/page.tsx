import { Landmark } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm sm:p-10">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-900 text-white">
          <Landmark aria-hidden="true" className="size-5" />
        </div>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-neutral-600">
          Sign in to your private finance dashboard.
        </p>
        <SignInForm />
      </section>
    </main>
  );
}
