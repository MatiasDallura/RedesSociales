import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        panel: "#f7f8fb",
        line: "#dbe1ea",
        brand: {
          50: "#eef7ff",
          100: "#d8edff",
          500: "#1f88e5",
          600: "#176ec1",
          700: "#155b9f"
        },
        mint: {
          50: "#edfdf7",
          500: "#12a87e",
          700: "#087a62"
        },
        amber: {
          50: "#fff7e7",
          500: "#d6871d"
        },
        rose: {
          50: "#fff0f2",
          500: "#d9475f"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
