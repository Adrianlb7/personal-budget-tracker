"use client";

import { Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompletionMessage() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    router.replace("/app/recurring", { scroll: false });
  };

  return (
    <div
      aria-labelledby="completion-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/25 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white p-7 text-center shadow-[0_28px_90px_-35px_rgba(6,78,59,0.65)]">
        <Sparkles className="absolute top-7 left-8 size-5 text-emerald-300" />
        <Sparkles className="absolute top-12 right-8 size-4 text-amber-400" />
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-amber-50 text-emerald-800 shadow-inner">
          <Trophy className="size-7" />
        </span>
        <h2
          className="mt-5 text-2xl font-semibold tracking-[-0.03em]"
          id="completion-title"
        >
          You did it!
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Every installment is paid. That commitment is officially complete.
        </p>
        <button
          className="mt-6 w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          onClick={dismiss}
          type="button"
        >
          Celebrate the win
        </button>
      </div>
    </div>
  );
}
