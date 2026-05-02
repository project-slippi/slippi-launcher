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
