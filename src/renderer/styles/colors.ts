// Gotta manually keep these in sync with ./tokens.stylex.ts for now.
// Hopefully we can eventually remove this file by using MUI themes
// or just using StyleX for all custom colours.

export const colors = {
  greenPrimary: "#72d07f", // Should be accessed with useTheme instead
  purplePrimary: "#b984bb", // Should be accessed with useTheme instead

  // These are used on the home/launch page
  grayDark: "#222222",
  greenDark: "#21BA45",
  greenDarker: "#208E2C",
  purpleLighter: "#9f74c0",
  purpleLight: "#8665A0",
  purple: "#310057",
  purpleDark: "#29133B",
  purpleDarker: "#1B0B28",
  offGray: "#2D313A",
  offWhite: "#E0E0E0",

  // From slippi website
  textPrimary: "#E9EAEA",
  textSecondary: "#B4B4B4",
  textDim: "#939599",
  textVeryDim: "#5E6066",
} as const;

const cssVars = {
  greenPrimary: "--green-primary",
  purplePrimary: "--purple-primary",

  grayDark: "--gray-dark",
  greenDark: "--green-dark",
  greenDarker: "--green-darker",
  purpleLighter: "--purple-lighter",
  purpleLight: "--purple-light",
  purple: "--purple",
  purpleDark: "--purple-dark",
  purpleDarker: "--purple-darker",
  offGray: "--off-gray",
  offWhite: "--off-white",

  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  textDim: "--text-dim",
  textVeryDim: "--text-very-dim",
} as const;

type CssVarKey = keyof typeof cssVars;

export function cssVar(name: CssVarKey) {
  return `var(${cssVars[name]})`;
}
