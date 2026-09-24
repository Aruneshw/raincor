import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme: ThemeMode) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("raincor_theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {
        // ignore localStorage errors (e.g. private mode)
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
  initTheme: () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("raincor_theme") as ThemeMode | null;
        if (stored === "dark" || stored === "light") {
          get().setTheme(stored);
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          get().setTheme(prefersDark ? "dark" : "light");
        }
      } catch {
        get().setTheme("light");
      }
    }
  },
}));
