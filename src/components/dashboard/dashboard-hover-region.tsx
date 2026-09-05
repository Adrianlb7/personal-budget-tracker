"use client";

import type { PointerEvent, ReactNode } from "react";

const restingShadow = "";
const hoverShadow = "0 26px 60px -40px rgb(3 32 24 / 0.55)";

function hoverSurface(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>("article, [data-dashboard-hover]")
    : null;
}

function remainsInside(card: HTMLElement, target: EventTarget | null) {
  return target instanceof Node && card.contains(target);
}

export function DashboardHoverRegion({ children }: { children: ReactNode }) {
  const handlePointerOver = (event: PointerEvent<HTMLElement>) => {
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const surface = hoverSurface(event.target);
    if (!surface || remainsInside(surface, event.relatedTarget)) return;

    surface.style.transition =
      "transform 480ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 480ms cubic-bezier(0.22, 1, 0.36, 1), filter 480ms ease, background-color 240ms ease";
    surface.style.transform = surface.matches("article")
      ? "translateY(-3px) scale(1.006)"
      : "translateY(-2px) scale(1.012)";
    if (surface.matches("article")) {
      surface.style.boxShadow = hoverShadow;
      surface.style.filter = "brightness(1.008)";
    }
  };

  const handlePointerOut = (event: PointerEvent<HTMLElement>) => {
    const surface = hoverSurface(event.target);
    if (!surface || remainsInside(surface, event.relatedTarget)) return;

    surface.style.transform = "";
    surface.style.boxShadow = restingShadow;
    surface.style.filter = "";
  };

  return (
    <section
      className="relative z-10 mx-auto max-w-7xl"
      data-dashboard
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
    >
      {children}
    </section>
  );
}
