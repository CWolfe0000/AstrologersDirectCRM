import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        ink: { DEFAULT: "#29272B", 2: "#3A373D", 3: "#4A464E" },
        canvas: { DEFAULT: "#F7F5F1", 2: "#F0EDE7", 3: "#E9E5DE" },
        surface: "#FFFFFF",
        accent: { DEFAULT: "#824B59", hover: "#693A47", 50: "#F6EEF0", 100: "#EDDCE1", 200: "#D9B9C2" },
        sage: { DEFAULT: "#83978B", dark: "#5E7266", 50: "#EFF3F0", 100: "#DEE6E0" },
        muted: "#68645F",
        line: { DEFAULT: "#E7E2DC", strong: "#D6CFC6" },
        warn: { DEFAULT: "#8F6420", 50: "#FBF3E6" },
        danger: { DEFAULT: "#A9443F", 50: "#F9ECEB" },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        glyph: ['"Segoe UI Symbol"', '"Apple Symbols"', '"Noto Sans Symbols"', '"DejaVu Sans"', "sans-serif"],
      },
      borderRadius: { lg: "10px", xl: "12px", "2xl": "16px" },
      boxShadow: {
        card: "0 1px 2px rgba(41,39,43,0.04)",
        pop: "0 8px 30px rgba(41,39,43,0.10), 0 1px 3px rgba(41,39,43,0.06)",
        frame: "0 30px 80px -20px rgba(41,39,43,0.25), 0 10px 30px -10px rgba(41,39,43,0.12)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: {
        "fade-in": "fade-in .15s ease-out",
        "slide-up": "slide-up .18s ease-out",
        "slide-in-right": "slide-in-right .22s ease-out",
        "slide-in-left": "slide-in-left .22s ease-out",
        pulse2: "pulse2 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
