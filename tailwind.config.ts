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
        'bg-primary': '#030712',
        'bg-secondary': '#0f1730',
        'dark-accent': '#000000',
        'text-primary': '#ffffff',
        'text-secondary': '#c7d0e0',
        'blue-glow': '#1e90ff',
        'blue-icon': '#4aa8ff',
        'blue-border': '#2e6fd9',
        'red-action': '#b91c1c',
        'red-glow': '#e54848',
      },
      boxShadow: {
        'neon-blue': '0 0 15px #1e90ff',
        'neon-red': '0 0 15px #e54848',
      },
    },
  },
  plugins: [],
};

export default config;
