import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0b",
          elevated: "#111114",
          muted: "#16171b",
        },
        border: {
          DEFAULT: "#24262c",
          subtle: "#1a1c21",
          strong: "#2f323a",
        },
        accent: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
          muted: "#164e63",
          glow: "#22d3ee",
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
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "\"Segoe UI\"",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(6, 182, 212, 0.45)",
        "glow-lg": "0 0 80px -12px rgba(6, 182, 212, 0.55)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -20px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, var(--color-bg, #0a0a0b) 90%), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
