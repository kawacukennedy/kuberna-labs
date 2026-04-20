import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e6eeff",
        "surface-container-high": "#dee9fc",
        "surface-container-highest": "#d9e3f6",
        "surface-dim": "#d0dbed",
        "surface-bright": "#f8f9ff",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
          foreground: "var(--primary-foreground)",
          "fixed": "#e1e0ff",
          "fixed-dim": "#c0c1ff",
          container: "#6063ee",
        },
        "primary-fixed-dim": "var(--primary-light)",
        secondary: {
          DEFAULT: "var(--secondary)",
          dark: "var(--secondary-dark)",
          light: "var(--secondary-light)",
          foreground: "var(--secondary-foreground)",
          fixed: "#6ffbbe",
          "fixed-dim": "#4edea3",
          container: "#6cf8bb",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dark: "var(--accent-dark)",
          light: "var(--accent-light)",
          foreground: "var(--accent-foreground)",
          container: "#a36700",
          fixed: "#ffddb8",
          "fixed-dim": "#ffb95f",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "on-surface": "#121c2a",
        "on-surface-variant": "#464554",
        "border": "var(--border)",
        "outline": "#767586",
        "outline-variant": "#c7c4d7",
        input: "var(--input)",
        ring: "var(--ring)",
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(70, 72, 212, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(70, 72, 212, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'ambient': '0 20px 40px rgba(18, 28, 42, 0.06)',
        'glow': '0 0 40px rgba(70, 72, 212, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
