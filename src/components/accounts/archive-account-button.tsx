import { Archive } from "lucide-react";
import { archiveAccount } from "@/domain/accounts/actions";

export function ArchiveAccountButton({ accountId }: { accountId: string }) {
  const action = archiveAccount.bind(null, accountId);

  return (
    <form action={action}>
      <button
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        type="submit"
      >
        <Archive aria-hidden="true" className="size-4" />
        Archive
      </button>
    </form>
  );
}
