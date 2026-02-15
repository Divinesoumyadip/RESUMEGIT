import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your signature Startup colors
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        charcoal: "#050505",
      },
      fontFamily: {
        // Mapping the Google Fonts from your globals.css
        orbitron: ["var(--font-orbitron)", "Orbitron", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "Rajdhani", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      animation: {
        // The infinite scrolling mission feed
        "marquee-slow": "marquee 40s linear infinite",
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;