"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  APPEARANCE_STORAGE_KEY,
  parseAppearance,
  resolveAppearance,
  type Appearance,
} from "@/lib/theme";

const options = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
  { icon: Monitor, label: "Auto", value: "system" },
] as const;

function applyAppearance(value: Appearance) {
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const resolved = resolveAppearance(value, prefersDark);
  document.documentElement.dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#11191b" : "#f6f8f7");
}

export function AppearanceSwitcher() {
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const sync = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
      } catch {
        // Private browsing can make storage unavailable; system mode still works.
      }
      const next = parseAppearance(stored);
      setAppearance(next);
      applyAppearance(next);
    };
    sync();
    media?.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("orba-appearance-change", sync);
    return () => {
      media?.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("orba-appearance-change", sync);
    };
  }, []);

  const choose = (value: Appearance) => {
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, value);
    } catch {
      // Keep this tab usable when persistent storage is blocked.
    }
    setAppearance(value);
    applyAppearance(value);
    window.dispatchEvent(new Event("orba-appearance-change"));
  };

  return (
    <div aria-label="Appearance" className="appearance-switcher" role="group">
      {options.map(({ icon: Icon, label, value }) => (
        <button
          aria-label={`${label} appearance`}
          aria-pressed={appearance === value}
          className="appearance-option"
          key={value}
          onClick={() => choose(value)}
          type="button"
        >
          <Icon aria-hidden="true" className="size-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
