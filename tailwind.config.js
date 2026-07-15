/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#101419",
        outline: "#434655",

        surfaceLow: "#151A20",
        surface: "#1C2025",
        surfaceHigh: "#252A31",
        surfaceHighest: "#31353B",

        foreground: "#E0E2EA",
        muted: "#C3C6D7",

        primary: "#2563EB",
        primarySoft: "#B4C5FF",

        success: "#22C55E",
        successBorder: "#79DB8D",

        error: "#FFB4AB",
        errorBorder: "#EF4444",
        errorSurface: "#241619",
        errorSolid: "#EF4444",
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        "2xl": 32,
        screenX: 24,
      },
      borderRadius: {
        button: 8,
        card: 8,
      },
    },
  },
  plugins: [],
};
