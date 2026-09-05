"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  categoryNameKey,
  normalizeCategoryName,
} from "@/domain/categories/catalog";

export function CategoryCombobox({
  categories,
  error,
  id,
  name = "category",
  placeholder,
}: {
  categories: string[];
  error?: string;
  id: string;
  name?: string;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedQuery = normalizeCategoryName(query);
  const exact = categories.find(
    (category) =>
      categoryNameKey(category) === categoryNameKey(normalizedQuery),
  );
  const filtered = useMemo(
    () =>
      categories.filter((category) =>
        categoryNameKey(category).includes(categoryNameKey(query)),
      ),
    [categories, query],
  );

  function choose(value: string) {
    setQuery(value);
    setSelected(value);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input name={name} type="hidden" value={selected} />
      <div style={{ marginTop: "0.5rem", position: "relative" }}>
        <input
          aria-autocomplete="list"
          aria-controls={`${id}-options`}
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className="w-full rounded-xl border bg-white px-4 py-3 pr-11 transition outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
          id={id}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            const match = categories.find(
              (category) =>
                categoryNameKey(category) === categoryNameKey(value),
            );
            setSelected(match ?? "");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (exact) choose(exact);
              else if (normalizedQuery) choose(normalizedQuery);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        <ChevronDown
          aria-hidden="true"
          color="#a3a3a3"
          size={16}
          style={{
            pointerEvents: "none",
            position: "absolute",
            right: "1rem",
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 180ms ease",
          }}
        />
      </div>

      {open && (
        <div
          id={`${id}-options`}
          role="listbox"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "1rem",
            boxShadow: "0 20px 55px -24px rgba(0, 0, 0, 0.4)",
            left: 0,
            marginTop: "0.5rem",
            maxHeight: "13.25rem",
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "0.375rem",
            position: "absolute",
            scrollbarColor: "#d4d4d4 transparent",
            scrollbarWidth: "thin",
            top: "100%",
            width: "100%",
            zIndex: 30,
          }}
        >
          {filtered.map((category) => {
            const active =
              categoryNameKey(category) === categoryNameKey(selected);
            return (
              <button
                aria-selected={active}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-neutral-100"
                key={category}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(category)}
                role="option"
                type="button"
              >
                {category}
                {active && (
                  <Check
                    aria-hidden="true"
                    className="size-4 text-emerald-700"
                  />
                )}
              </button>
            );
          })}

          {!exact && normalizedQuery && (
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-800 hover:bg-emerald-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(normalizedQuery)}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Create “{normalizedQuery}”
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {!selected && query && (
        <p className="mt-2 text-xs text-neutral-500">
          Choose a category or create this one from the menu.
        </p>
      )}
    </div>
  );
}
