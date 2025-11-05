export interface I18nService {
  currentLanguage: string;
  init(): Promise<void>;
  setLanguage(language: string): Promise<void>;
  getSupportedLanguages(): readonly Language[];
}

export type Language = {
  value: string;
  label: string;
};
