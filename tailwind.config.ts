import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0f0f0f",
          elevated: "#161616",
          muted: "#1d1d1d",
        },
        border: {
          DEFAULT: "#262626",
          subtle: "#1f1f1f",
        },
        accent: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
          muted: "#164e63",
        },
        text: {
          DEFAULT: "#fafafa",
          muted: "#a3a3a3",
          subtle: "#737373",
        },
        severity: {
          critical: "#ef4444",
          serious: "#f97316",
          moderate: "#eab308",
          minor: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(6, 182, 212, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
