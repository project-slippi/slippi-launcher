export type Language = "en" | "es" | "ja";

export type LanguageOption = {
  value: Language;
  label: string;
};

export interface I18nService {
  init(): Promise<void>;
  setLanguage(language: Language): Promise<void>;
  getSupportedLanguages(): readonly LanguageOption[];
  onLanguageChange(handle: (language: Language) => void): () => void;
}
