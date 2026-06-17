import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D1F",
        foreground: "#F1F5F9",
        surface: "rgba(255, 255, 255, 0.04)",
        border: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#6C63FF",
          light: "#A78BFA",
        },
        secondary: "#A78BFA",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: {
          DEFAULT: "#111827",
          foreground: "#94A3B8",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.04)",
          foreground: "#F1F5F9",
        },
        primary: {
          DEFAULT: "#6C63FF",
          foreground: "#FFFFFF",
        },
        destructive: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 12px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 40px rgba(108,99,255,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
