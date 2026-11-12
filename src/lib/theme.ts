export const APPEARANCE_STORAGE_KEY = "orba-appearance";

export type Appearance = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function parseAppearance(value: string | null): Appearance {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveAppearance(
  appearance: Appearance,
  prefersDark: boolean,
): ResolvedTheme {
  return appearance === "system"
    ? prefersDark
      ? "dark"
      : "light"
    : appearance;
}
