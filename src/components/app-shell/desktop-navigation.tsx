"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  Home,
  LayoutGrid,
  List,
  WalletCards,
} from "lucide-react";

const items = [
  { href: "/app", icon: Home, label: "Dashboard" },
  { href: "/app/accounts", icon: WalletCards, label: "Accounts" },
  { href: "/app/transactions", icon: List, label: "Transactions" },
  { href: "/app/budget", icon: LayoutGrid, label: "Budget" },
  { href: "/app/recurring", icon: CalendarClock, label: "Recurring" },
  { href: "/app/reports", icon: BarChart3, label: "Reports" },
] as const;

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="mt-11 space-y-1">
      {items.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/app" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="app-nav-link flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm"
            href={href}
            key={href}
          >
            <Icon
              aria-hidden="true"
              className="size-[1.1rem] shrink-0"
              strokeWidth={1.8}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
