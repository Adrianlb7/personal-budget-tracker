import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
      <section className="max-w-3xl">
        <div className="mb-8 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-900 text-white">
          <Landmark aria-hidden="true" className="size-6" />
        </div>
        <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
          Personal Finance Hub
        </p>
        <h1 className="text-5xl leading-tight font-semibold tracking-tight sm:text-7xl">
          A clearer view of your financial life.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          The project foundation is ready. Accounts, cash flow, budgets, and
          goals will arrive through the reviewed product phases.
        </p>
        <Link
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-6 py-3 font-medium text-white transition hover:bg-emerald-800"
          href="/sign-in"
        >
          Sign in
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </main>
  );
}
