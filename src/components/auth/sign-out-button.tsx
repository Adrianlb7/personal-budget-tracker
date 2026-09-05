import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
        style={{ color: "#050605" }}
        type="submit"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sign out
      </button>
    </form>
  );
}
