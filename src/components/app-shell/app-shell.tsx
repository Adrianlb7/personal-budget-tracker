import type { ReactNode } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppearanceSwitcher } from "@/components/appearance/appearance-switcher";
import { DesktopNavigation } from "@/components/app-shell/desktop-navigation";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";

export function AppShell({
  children,
  userEmail,
}: Readonly<{ children: ReactNode; userEmail: string | null }>) {
  return (
    <div className="relative isolate min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="app-sidebar relative z-20 hidden border-r p-5 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Link
          className="flex items-center gap-3 rounded-2xl px-2 py-1.5 font-semibold tracking-[-0.02em]"
          href="/"
        >
          <span className="flex size-10 items-center justify-center rounded-[0.9rem] bg-emerald-900 text-white shadow-sm">
            <Landmark aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg">Orba</span>
        </Link>
        <DesktopNavigation />
        <div className="mt-auto space-y-4 border-t pt-5">
          <div>
            <p className="mb-2 px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
              Appearance
            </p>
            <AppearanceSwitcher />
          </div>
          {userEmail && (
            <p className="truncate px-2 text-xs text-neutral-500">
              {userEmail}
            </p>
          )}
          <SignOutButton />
        </div>
      </aside>
      <main className="relative z-10 min-w-0 px-4 pt-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:p-9 lg:p-11">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
