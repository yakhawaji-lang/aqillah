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
        primary: {
          DEFAULT: "#006633",
          50: "#E6F5ED",
          100: "#CCEBDC",
          200: "#99D7B9",
          300: "#66C396",
          400: "#33AF73",
          500: "#006633",
          600: "#005229",
          700: "#003E1F",
          800: "#002914",
          900: "#00150A",
        },
        secondary: {
          DEFAULT: "#FFD700",
          50: "#FFF9E6",
          100: "#FFF3CC",
          200: "#FFE799",
          300: "#FFDB66",
          400: "#FFCF33",
          500: "#FFD700",
          600: "#CCAC00",
          700: "#998100",
          800: "#665600",
          900: "#332B00",
        },
        traffic: {
          green: "#10B981",
          yellow: "#F59E0B",
          orange: "#F97316",
          red: "#EF4444",
          dark: "#991B1B",
        },
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "var(--font-tajawal)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

