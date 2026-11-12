import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { AppearanceSwitcher } from "@/components/appearance/appearance-switcher";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10">
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-900 text-white">
            <Landmark aria-hidden="true" className="size-5" />
          </span>
          Orba
        </div>
        <div className="w-48">
          <AppearanceSwitcher />
        </div>
      </div>
      <section className="my-auto max-w-3xl py-20">
        <div className="mb-8 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-900 text-white shadow-[0_12px_30px_-18px_rgba(5,102,72,0.75)]">
          <Landmark aria-hidden="true" className="size-6" />
        </div>
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-emerald-800 uppercase">
          A calmer way to see your money
        </p>
        <h1 className="text-5xl leading-[1.05] font-semibold tracking-[-0.055em] sm:text-7xl">
          A clearer view of your financial life.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-600">
          Accounts, spending, budgets and commitments in one private place. Less
          noise, more confidence in every decision.
        </p>
        <Link
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-6 py-3.5 font-medium text-white shadow-[0_15px_28px_-18px_rgba(5,102,72,0.7)] transition hover:-translate-y-0.5 hover:bg-emerald-800"
          href="/sign-in"
        >
          Sign in
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </main>
  );
}
