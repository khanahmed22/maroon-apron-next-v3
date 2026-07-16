export const THEME_NAMES = ["red", "pink", "blue", "green", "purple"] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = "red";

export function resolveThemeName(restTheme?: string | null): ThemeName {
  return (THEME_NAMES as readonly string[]).includes(restTheme ?? "")
    ? (restTheme as ThemeName)
    : DEFAULT_THEME;
}