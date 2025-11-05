export interface I18nService {
  currentLanguage: string;
  setLanguage(language: string): Promise<void>;
  init(): Promise<void>;
}
