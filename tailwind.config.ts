import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep ocean base
        ocean: {
          950: "#040d18",
          900: "#071627",
          850: "#0a1c33",
          800: "#0e2440",
          700: "#15325a",
          600: "#1e4478",
        },
        // Aqua / teal accent — the SANVIC signature
        tide: {
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        // Warm sand for secondary highlights
        sand: {
          200: "#f5e3c3",
          300: "#eccf9e",
          400: "#e0b878",
        },
        // Muted foreground scale on dark
        mist: {
          100: "#e8f0f7",
          200: "#c9d8e5",
          300: "#a3b8ca",
          400: "#7b93a8",
          500: "#5a7186",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(2, 12, 27, 0.45)",
        glow: "0 0 24px rgba(45, 212, 191, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "slide-in-right": "slide-in-right 0.28s ease-out both",
        "slide-up": "slide-up 0.28s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
