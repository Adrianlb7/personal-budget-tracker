"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  Home,
  Landmark,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  WalletCards,
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";

const primaryItems = [
  { href: "/app", icon: Home, label: "Home", match: "exact" },
  {
    href: "/app/transactions",
    icon: List,
    label: "Transactions",
    match: "prefix",
  },
  {
    href: "/app/reports",
    icon: BarChart3,
    label: "Stats",
    match: "prefix",
  },
] as const;

const moreItems = [
  { href: "/app/accounts", icon: WalletCards, label: "Accounts" },
  { href: "/app/budget", icon: LayoutGrid, label: "Budget" },
  { href: "/app/recurring", icon: CalendarClock, label: "Recurring" },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        aria-hidden={!open}
        aria-label="More navigation"
        aria-modal="true"
        className={`fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-4 z-50 rounded-[1.75rem] border border-black/[0.07] bg-white/95 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-300 md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
        role="dialog"
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-950 text-white">
              <Landmark aria-hidden="true" className="size-4" />
            </span>
            Orba
          </div>
          <button
            aria-label="Close menu"
            className="flex size-9 items-center justify-center rounded-full bg-neutral-100"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav className="grid grid-cols-3 gap-2" aria-label="Additional pages">
          {moreItems.map(({ href, icon: Icon, label }) => (
            <Link
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-50 text-sm font-medium text-neutral-700"
              href={href}
              key={href}
              onClick={() => setOpen(false)}
            >
              <Icon aria-hidden="true" className="size-5 text-emerald-800" />
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-3 border-t pt-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-600"
            type="submit"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </button>
        </form>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-black/[0.06] bg-white/92 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-28px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {primaryItems.map(({ href, icon: Icon, label, match }) => {
            const active =
              match === "exact" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium transition ${
                  active ? "text-emerald-900" : "text-neutral-400"
                }`}
                href={href}
                key={href}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-5 ${active ? "fill-emerald-900/10" : ""}`}
                />
                {label}
              </Link>
            );
          })}
          <button
            aria-expanded={open}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium transition ${
              open ? "text-emerald-900" : "text-neutral-400"
            }`}
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <Menu aria-hidden="true" className="size-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
