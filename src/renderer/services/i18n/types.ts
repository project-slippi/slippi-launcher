export type Language = "en" | "es" | "ja";

export type LanguageOption = {
  value: Language;
  label: string;
};

export interface I18nService {
  init(): Promise<void>;
  setLanguage(language: string): Promise<void>;
  getSupportedLanguages(): readonly LanguageOption[];
  onLanguageChange(handle: (language: string) => void): () => void;
}
