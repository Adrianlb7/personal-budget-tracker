"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export function MoneyValue({
  children,
  strong = false,
}: {
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <span data-money-value={strong ? "strong" : "standard"}>
      <span data-money-text>{children}</span>
    </span>
  );
}

export function DashboardPrivacyToggle() {
  const [hidden, setHidden] = useState(false);

  const toggle = (button: HTMLButtonElement) => {
    const dashboard = button.closest<HTMLElement>("[data-dashboard]");
    const next = !hidden;
    dashboard?.classList.toggle("money-hidden", next);
    setHidden(next);
  };

  return (
    <>
      <style>{`
        [data-money-value] { display: inline-block; position: relative; }
        [data-money-text] { display: inline-block; transition: filter 360ms ease, opacity 360ms ease; }
        .money-hidden [data-money-text] { filter: blur(9px); opacity: .72; user-select: none; }
        .money-hidden [data-money-value="strong"] [data-money-text] { filter: blur(15px); opacity: .58; }
        .money-hidden [data-money-value]::after {
          background: currentColor;
          border-radius: 999px;
          content: "";
          height: 2px;
          left: -2%;
          opacity: .9;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 104%;
        }
      `}</style>
      <button
        aria-label={hidden ? "Show monetary values" : "Hide monetary values"}
        aria-pressed={hidden}
        className="relative flex size-11 items-center justify-center text-neutral-950"
        data-dashboard-hover
        onClick={(event) => toggle(event.currentTarget)}
        type="button"
      >
        <Eye
          aria-hidden="true"
          className="absolute size-4 transition duration-300"
          style={{
            filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.28))",
            opacity: hidden ? 0 : 1,
            transform: hidden ? "scale(.65) rotate(-12deg)" : "scale(1)",
          }}
        />
        <EyeOff
          aria-hidden="true"
          className="absolute size-4 transition duration-300"
          style={{
            filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.28))",
            opacity: hidden ? 1 : 0,
            transform: hidden ? "scale(1)" : "scale(.65) rotate(12deg)",
          }}
        />
      </button>
    </>
  );
}
