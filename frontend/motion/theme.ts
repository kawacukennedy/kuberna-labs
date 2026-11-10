/**
 * Brand tokens shared by every Remotion composition.
 * Kept in sync with frontend/src/styles/globals.css.
 */
export const BRAND = {
  indigo: "#4648d4",
  indigoDeep: "#312e81",
  indigoLight: "#818cf8",
  emerald: "#006c49",
  emeraldLight: "#34d399",
  amber: "#fbbf24",
  ink: "#121c2a",
  paper: "#f8f9ff",
} as const;

export const CANVAS = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Centered, clamped interpolate with a smooth expo-out feel. */
export const easeOut = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
