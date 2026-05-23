/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "text-primary": "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        stroke: "hsl(var(--stroke))",
        accent: "hsl(var(--accent))",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Instrument Serif", "serif"],
      },
      animation: {
        "role-fade-in": "role-fade-in 0.4s ease-out forwards",
        "scroll-down": "scroll-down 1.5s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
