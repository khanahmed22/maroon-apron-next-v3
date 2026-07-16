// lib/themes.ts
// Colors now live entirely in globals.css as CSS custom properties
// (--primary, --accent, --border, --ring, etc.), swapped per theme via
// a `data-theme` attribute. This file's only job is to validate the
// restTheme value coming from the DB and fall back safely to red.
//
// To add a 6th theme:
//   1. Add its name to THEME_NAMES below.
//   2. Add matching `[data-theme="name"]` and `.dark[data-theme="name"]`
//      blocks in globals.css.
// No component changes needed.

export const THEME_NAMES = ["red", "pink", "blue", "green", "purple"] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = "red";

export function resolveThemeName(restTheme?: string | null): ThemeName {
  return (THEME_NAMES as readonly string[]).includes(restTheme ?? "")
    ? (restTheme as ThemeName)
    : DEFAULT_THEME;
}