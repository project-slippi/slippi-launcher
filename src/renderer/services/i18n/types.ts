export interface I18nService {
  init(): Promise<void>;
  setLanguage(language: string): Promise<void>;
  onLanguageChange(handle: (language: string) => void): () => void;
}
