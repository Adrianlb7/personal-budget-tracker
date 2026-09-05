"use client";

import { useEffect, useRef } from "react";

export function LiquidDashboardBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    document.documentElement.classList.add("dashboard-scrollbar-hidden");
    document.body.classList.add("dashboard-scrollbar-hidden");
    const scrollbarStyle = document.createElement("style");
    scrollbarStyle.dataset.dashboardScrollbar = "true";
    scrollbarStyle.textContent =
      "html.dashboard-scrollbar-hidden, body.dashboard-scrollbar-hidden { scrollbar-width: none !important; } html.dashboard-scrollbar-hidden::-webkit-scrollbar, body.dashboard-scrollbar-hidden::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; background: transparent !important; }";
    document.head.appendChild(scrollbarStyle);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      return () => {
        document.documentElement.classList.remove("dashboard-scrollbar-hidden");
        document.body.classList.remove("dashboard-scrollbar-hidden");
        scrollbarStyle.remove();
      };
    }

    let frame = 0;
    let currentX = window.innerWidth * 0.62;
    let currentY = window.innerHeight * 0.38;
    let targetX = currentX;
    let targetY = currentY;

    const render = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      root.style.setProperty("--liquid-x", `${currentX}px`);
      root.style.setProperty("--liquid-y", `${currentY}px`);
      root.style.setProperty(
        "--liquid-shift-x",
        `${((currentX / window.innerWidth - 0.5) * 18).toFixed(2)}px`,
      );
      root.style.setProperty(
        "--liquid-shift-y",
        `${((currentY / window.innerHeight - 0.5) * 14).toFixed(2)}px`,
      );
      root.style.setProperty(
        "--liquid-counter-x",
        `${((0.5 - currentX / window.innerWidth) * 11).toFixed(2)}px`,
      );
      root.style.setProperty(
        "--liquid-counter-y",
        `${((0.5 - currentY / window.innerHeight) * 9).toFixed(2)}px`,
      );
      frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };
    const ripple = (event: PointerEvent) => {
      [0, 150, 300].forEach((delay, index) => {
        const wave = document.createElement("span");
        wave.style.cssText = [
          "position:absolute",
          `left:${event.clientX}px`,
          `top:${event.clientY}px`,
          "width:72px",
          "height:72px",
          "border-radius:9999px",
          "border:1px solid rgba(167,243,208,.5)",
          "box-shadow:0 0 34px 12px rgba(45,212,191,.14), inset 0 0 24px rgba(153,246,228,.16)",
          "transform:translate(-50%,-50%) scale(.25)",
          "opacity:0",
          "pointer-events:none",
          "will-change:transform,opacity,filter",
        ].join(";");
        root.appendChild(wave);

        const animation = wave.animate(
          [
            {
              filter: "blur(2px)",
              opacity: 0,
              transform: "translate(-50%,-50%) scale(.25)",
            },
            {
              filter: "blur(5px)",
              opacity: 0.36 - index * 0.06,
              offset: 0.16,
            },
            {
              filter: "blur(12px)",
              opacity: 0,
              transform: `translate(-50%,-50%) scale(${7.5 + index * 1.8})`,
            },
          ],
          {
            delay,
            duration: 1650 + index * 180,
            easing: "cubic-bezier(.16,1,.3,1)",
          },
        );
        animation.onfinish = () => wave.remove();
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", ripple, { passive: true });
    frame = requestAnimationFrame(render);
    return () => {
      document.documentElement.classList.remove("dashboard-scrollbar-hidden");
      document.body.classList.remove("dashboard-scrollbar-hidden");
      scrollbarStyle.remove();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", ripple);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={rootRef}
      style={{
        inset: 0,
        pointerEvents: "none",
        position: "fixed",
        zIndex: 0,
      }}
    >
      <div
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,245,242,0.4), rgba(244,245,242,0.4)), url('/assets/dashboard-liquid.jpg')",
          backgroundPosition: "center 46%",
          backgroundSize: "100% 150%",
          filter: "saturate(0.88) contrast(0.98)",
          inset: "-2rem",
          opacity: 0.72,
          position: "absolute",
        }}
      />
      <div
        style={{
          backgroundImage: "url('/assets/dashboard-liquid.jpg')",
          backgroundPosition: "center 46%",
          backgroundSize: "102% 152%",
          filter: "blur(6px) saturate(1.2) contrast(1.04)",
          inset: "-2rem",
          maskImage:
            "radial-gradient(circle 340px at var(--liquid-x, 62vw) var(--liquid-y, 38vh), rgba(0,0,0,.82) 0%, rgba(0,0,0,.55) 32%, rgba(0,0,0,.2) 62%, transparent 88%)",
          opacity: 0.34,
          position: "absolute",
          transform:
            "translate(var(--liquid-shift-x, 0px), var(--liquid-shift-y, 0px)) scale(1.035)",
          WebkitMaskImage:
            "radial-gradient(circle 340px at var(--liquid-x, 62vw) var(--liquid-y, 38vh), rgba(0,0,0,.82) 0%, rgba(0,0,0,.55) 32%, rgba(0,0,0,.2) 62%, transparent 88%)",
          willChange: "transform, mask-image",
        }}
      />
      <div
        style={{
          backgroundImage: "url('/assets/dashboard-liquid.jpg')",
          backgroundPosition: "center 46%",
          backgroundSize: "104% 154%",
          filter: "blur(9px) saturate(1.1)",
          inset: "-2rem",
          maskImage:
            "radial-gradient(circle 245px at var(--liquid-x, 62vw) var(--liquid-y, 38vh), transparent 0 18%, rgba(0,0,0,.42) 38%, rgba(0,0,0,.2) 58%, transparent 84%)",
          opacity: 0.2,
          position: "absolute",
          transform:
            "translate(var(--liquid-counter-x, 0px), var(--liquid-counter-y, 0px)) scale(1.022)",
          WebkitMaskImage:
            "radial-gradient(circle 245px at var(--liquid-x, 62vw) var(--liquid-y, 38vh), transparent 0 18%, rgba(0,0,0,.42) 38%, rgba(0,0,0,.2) 58%, transparent 84%)",
          willChange: "transform, mask-image",
        }}
      />
      <div
        style={{
          background:
            "radial-gradient(circle 320px at var(--liquid-x, 62vw) var(--liquid-y, 38vh), rgba(110,231,183,.085), rgba(20,184,166,.03) 42%, transparent 86%)",
          filter: "blur(10px)",
          inset: 0,
          position: "absolute",
        }}
      />
    </div>
  );
}
