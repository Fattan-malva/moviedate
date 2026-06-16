import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        foreground: "#ededed",
        card: "#14141f",
        "card-hover": "#1a1a2e",
        accent: "#7c3aed",
        "accent-hover": "#6d28d9",
        muted: "#6b7280",
        border: "#1f1f2e",
      },
    },
  },
  plugins: [],
};

export default config;
