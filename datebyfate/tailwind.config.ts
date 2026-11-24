import type { Config } from "tailwindcss";

/**
 * The palette, type and surfaces of AstrologersDirect, so the two products read as one family.
 * The older Datebyfate colour names (cream, paper, rose, gold, night) are kept as aliases of it.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
        // Aliases used by pages written before the redesign.
        cream: { DEFAULT: "#F7F5F1", 2: "#F0EDE7" },
        paper: "#FFFFFF",
        rose: { DEFAULT: "#824B59", hover: "#693A47", soft: "#F6EEF0", line: "#D9B9C2" },
        gold: { DEFAULT: "#8F6420", soft: "#FBF3E6" },
        night: { DEFAULT: "#29272B", 2: "#3A373D" },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        glyph: ['"Segoe UI Symbol"', '"Apple Symbols"', '"Noto Sans Symbols"', '"Noto Sans Symbols 2"', '"DejaVu Sans"', "sans-serif"],
      },
      borderRadius: { lg: "10px", xl: "12px", "2xl": "16px", "3xl": "16px" },
      boxShadow: {
        card: "0 1px 2px rgba(41,39,43,0.04)",
        pop: "0 8px 30px rgba(41,39,43,0.10), 0 1px 3px rgba(41,39,43,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
