import Link from "next/link";
import { Landmark, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[#f4f5f2] px-6 py-16">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-lg shadow-emerald-950/15">
          <Landmark aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
          Orba
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          You’re offline
        </h1>
        <p className="mt-3 leading-7 text-neutral-600">
          Reconnect to safely load your latest financial information.
        </p>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          href="/app"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Try again
        </Link>
      </section>
    </main>
  );
}
