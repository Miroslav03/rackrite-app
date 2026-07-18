const errorAccent = "#EF4444";

export const colors = {
  background: "#0B0F14",
  outline: "#434655",

  surface: "#101419",
  surfaceHigh: "#252A31",
  surfaceHighest: "#31353B",

  foreground: "#E0E2EA",
  muted: "#C3C6D7",

  primary: "#2563EB",
  primarySoft: "#B4C5FF",

  success: "#22C55E",
  successBorder: "#79DB8D",
  successSurface: "#131F1D",

  error: "#FFB4AB",
  errorBorder: errorAccent,
  errorSurface: "#241619",
  errorSolid: errorAccent,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  screenX: 24,
} as const;

export const radius = {
  xl: 8,
} as const;

export const font = {
  family: "Inter",
} as const;
