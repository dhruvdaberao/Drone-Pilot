import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9",
          border: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "var(--font-heading)",
          "var(--font-poppins)",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
        poppins: ["var(--font-poppins)", "sans-serif"],
        mono: [
          "\"SF Mono\"",
          "\"JetBrains Mono\"",
          "ui-monospace",
          "monospace",
        ],
      },
      boxShadow: {
        "subtle-card": "0 10px 30px -10px rgba(0, 0, 0, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "subtle-glow": "0 0 20px -5px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
