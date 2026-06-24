import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#d7dee8",
        ink: "#172033",
        muted: "#667085",
        surface: "#f7f9fc",
        brand: "#0f766e",
        accent: "#b45309",
      },
      boxShadow: {
        panel: "0 12px 30px rgb(23 32 51 / 8%)",
      },
    },
  },
  plugins: [],
};

export default config;
