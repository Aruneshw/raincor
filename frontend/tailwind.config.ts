import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "var(--navy-default, #0B2A4A)",
          deep: "var(--navy-deep, #08213D)",
          light: "var(--navy-light, #184572)",
          muted: "var(--navy-muted, #4F6E8C)",
        },
        brand: {
          blue: "#2F80D9",
          "blue-dark": "#1E68BA",
          "blue-light": "#EAF5FF",
          "blue-subtle": "#F0F7FF",
        },
        weather: {
          success: "#22A06B",
          warning: "#F2A93B",
          danger: "#E05252",
          purple: "#7566D8",
          // IMD Rainfall Scale
          dry: "#E8EEF5",
          "light-blue": "#D0E8FA",
          "med-blue": "#5DAAE8",
          "rain-blue": "#2F80D9",
          "heavy-blue": "#1D64B5",
          "very-heavy": "#F2A93B",
          extreme: "#E05252",
          exceptional: "#8B1E8F",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        clay: "0 10px 25px -5px rgba(11, 42, 74, 0.05), 0 8px 10px -6px rgba(11, 42, 74, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)",
        "clay-hover": "0 14px 28px -4px rgba(11, 42, 74, 0.09), inset 0 1px 2px 0 rgba(255, 255, 255, 1)",
        "clay-active": "0 4px 10px -2px rgba(11, 42, 74, 0.08), inset 0 2px 4px 0 rgba(11, 42, 74, 0.06)",
        "clay-inset": "inset 0 2px 5px 0 rgba(11, 42, 74, 0.06), inset 0 1px 2px 0 rgba(11, 42, 74, 0.04)",
        "clay-button": "0 6px 16px -2px rgba(47, 128, 217, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)",
        "clay-button-hover": "0 8px 22px -2px rgba(47, 128, 217, 0.4), inset 0 1px 2px 0 rgba(255, 255, 255, 0.75)",
      },
    },
  },
  plugins: [],
};

export default config;
