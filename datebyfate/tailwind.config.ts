import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { xl: "1120px" } },
    extend: {
      colors: {
        cream: { DEFAULT: "#FAF5EF", 2: "#F3EAE0" },
        paper: "#FFFDFA",
        ink: { DEFAULT: "#2B1B2E", 2: "#463449" },
        muted: "#6B5A6E",
        line: { DEFAULT: "#E8DDD3", strong: "#D5C6BA" },
        rose: { DEFAULT: "#C2415B", hover: "#A83249", soft: "#FBE9EC", line: "#F0C9D0" },
        gold: { DEFAULT: "#9A6B1F", soft: "#F8EFDD" },
        night: { DEFAULT: "#231428", 2: "#35203B" },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"DM Sans Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(43,27,46,0.05), 0 8px 24px -12px rgba(43,27,46,0.12)" },
    },
  },
  plugins: [],
};
export default config;
