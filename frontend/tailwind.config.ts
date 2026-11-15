import type { Config } from "tailwindcss"

const c = (v: string) => `color-mix(in srgb, var(${v}) calc(<alpha-value> * 100%), transparent)`

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: c("--border"),
        input: c("--input"),
        ring: c("--ring"),
        background: c("--background"),
        foreground: c("--foreground"),
        primary: {
          DEFAULT: c("--primary"),
          foreground: c("--primary-foreground"),
        },
        secondary: {
          DEFAULT: c("--secondary"),
          foreground: c("--foreground"),
        },
        destructive: {
          DEFAULT: c("--destructive"),
          foreground: c("--primary-foreground"),
        },
        success: {
          DEFAULT: c("--success"),
        },
        warning: {
          DEFAULT: c("--warning"),
        },
        muted: {
          DEFAULT: c("--muted"),
          foreground: c("--muted-foreground"),
        },
        accent: {
          DEFAULT: c("--accent"),
          foreground: c("--accent-foreground"),
        },
        popover: {
          DEFAULT: c("--popover"),
          foreground: c("--foreground"),
        },
        card: {
          DEFAULT: c("--card"),
          foreground: c("--foreground"),
        },
        brand: c("--brand"),
        sidebar: {
          DEFAULT: c("--sidebar"),
          foreground: c("--sidebar-foreground"),
          accent: c("--sidebar-accent"),
          border: c("--sidebar-border"),
        },
        chart: {
          "1": c("--chart-1"),
          "2": c("--chart-2"),
          "3": c("--chart-3"),
          "4": c("--chart-4"),
          "5": c("--chart-5"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config