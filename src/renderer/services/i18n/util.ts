export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
];

export function getSystemLanguage(): string {
  const locale = window.electron.bootstrap.locale ?? navigator.language;
  const systemLanguage = locale.split("-")[0];
  if (SUPPORTED_LANGUAGES.some((lang) => lang.value === systemLanguage)) {
    return systemLanguage;
  }
  return "en";
}
