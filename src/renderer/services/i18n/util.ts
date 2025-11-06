export const SUPPORTED_LANGUAGES = [
  { value: "en-US", label: "English" },
  { value: "es-ES", label: "Español" },
  { value: "ja-JP", label: "日本語" },
];

export function getSystemLanguage(): string {
  const systemLanguage = window.electron.bootstrap.locale ?? navigator.language;
  if (SUPPORTED_LANGUAGES.some((lang) => lang.value === systemLanguage)) {
    return systemLanguage;
  }
  return "en-US";
}
