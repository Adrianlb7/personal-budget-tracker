"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

export function ConfirmActionButton({
  action,
  children,
  confirmation,
  className,
}: {
  action: () => Promise<void>;
  children: ReactNode;
  confirmation: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)} type="button">
        {children}
      </button>

      {open &&
        createPortal(
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            onMouseDown={() => setOpen(false)}
            role="dialog"
            style={{
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.3)",
              display: "flex",
              inset: 0,
              justifyContent: "center",
              padding: "16px",
              position: "fixed",
              zIndex: 2147483647,
            }}
          >
            <div
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                background: "white",
                border: "1px solid #dde3dc",
                borderRadius: "16px",
                boxShadow: "0 24px 70px rgba(0, 0, 0, 0.22)",
                boxSizing: "border-box",
                padding: "20px",
                width: "min(320px, calc(100vw - 32px))",
              }}
            >
              <h2
                id={titleId}
                style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}
              >
                Delete this item?
              </h2>
              <p
                style={{
                  color: "#647066",
                  fontSize: "14px",
                  lineHeight: 1.45,
                  margin: "8px 0 0",
                }}
              >
                {confirmation}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  marginTop: "18px",
                }}
              >
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "transparent",
                    border: 0,
                    borderRadius: "8px",
                    color: "#525252",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "8px 12px",
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <form action={action}>
                  <DeleteButton />
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      style={{
        background: "#b91c1c",
        border: 0,
        borderRadius: "8px",
        color: "white",
        cursor: pending ? "wait" : "pointer",
        fontSize: "14px",
        fontWeight: 500,
        padding: "8px 14px",
      }}
      type="submit"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
