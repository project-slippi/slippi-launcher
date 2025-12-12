export type SupportedLanguage = "en" | "es" | "ja" | "ru" | "pt";

export const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
  { value: "ru", label: "Русский" },
  { value: "pt", label: "Português" },
];

export function getSystemLanguage(): string {
  const locale = window.electron.bootstrap.locale ?? navigator.language;
  const systemLanguage = locale.split("-")[0];
  if (SUPPORTED_LANGUAGES.some((lang) => lang.value === systemLanguage)) {
    return systemLanguage;
  }
  return "en";
}
