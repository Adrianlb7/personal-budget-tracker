import type { ReactNode } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

const navigation = [
  "Dashboard",
  "Accounts",
  "Transactions",
  "Budget",
  "Recurring",
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
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
          {navigation.map((item, index) => (
            <span
              className={`block rounded-xl px-3 py-2 text-sm ${index === 0 ? "bg-emerald-50 font-medium text-emerald-900" : "text-neutral-500"}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <main className="p-6 sm:p-10">{children}</main>
    </div>
  );
}
