import type { ReactNode } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/accounts", label: "Accounts" },
  { href: "/app/transactions", label: "Transactions" },
  { href: "/app/budget", label: "Budget" },
  { href: "/app/recurring", label: "Recurring" },
];

export function AppShell({
  children,
  userEmail,
}: Readonly<{ children: ReactNode; userEmail: string | null }>) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b bg-white p-6 md:min-h-screen md:border-r md:border-b-0">
        <Link className="flex items-center gap-3 font-semibold" href="/">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-900 text-white">
            <Landmark aria-hidden="true" className="size-5" />
          </span>
          Finance Hub
        </Link>
        <nav aria-label="Primary" className="mt-10 hidden space-y-1 md:block">
          {navigation.map((item) => (
            <Link
              className="block rounded-xl px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 hidden border-t pt-5 md:block">
          {userEmail && (
            <p className="mb-2 truncate px-3 text-xs text-neutral-500">
              {userEmail}
            </p>
          )}
          <SignOutButton />
        </div>
      </aside>
      <main className="p-6 sm:p-10">{children}</main>
    </div>
  );
}
