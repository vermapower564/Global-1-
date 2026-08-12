export type ThemeMode = "light" | "dark";

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("oms_theme_mode") as ThemeMode | null;
  if (stored === "dark" || stored === "light") return stored;
  return "light"; // Default to Day Mode (Light)
}

export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function toggleThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const current = getStoredThemeMode();
  const next: ThemeMode = current === "light" ? "dark" : "light";
  localStorage.setItem("oms_theme_mode", next);
  applyThemeToDocument(next);
  return next;
}
