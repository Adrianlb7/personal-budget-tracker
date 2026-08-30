import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
