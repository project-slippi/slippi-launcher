import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import ICU from "i18next-icu";

import type { I18nService, Language } from "./types";

const SUPPORTED_LANGUAGES: Language[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
];

class I18nClient implements I18nService {
  private readonly localStorageKey = "preferred-language";
  private initialized = false;

  constructor(private readonly defaultLanguage = "en") {}

  public get currentLanguage(): string {
    return i18next.language;
  }

  public async setLanguage(language: string): Promise<void> {
    localStorage.setItem(this.localStorageKey, language);
    await i18next.changeLanguage(language);
  }

  public getSupportedLanguages(): readonly Language[] {
    return SUPPORTED_LANGUAGES;
  }

  public async init(): Promise<void> {
    if (this.initialized && i18next.isInitialized) {
      console.log("i18next already initialized, skipping...");
      return;
    }

    try {
      await i18next
        .use(ICU)
        .use(HttpApi)
        .init({
          backend: {
            loadPath: "./locales/{{lng}}.json",
          },
          fallbackLng: this.defaultLanguage,
          lng: localStorage.getItem(this.localStorageKey) || this.defaultLanguage,
          debug: false,
        });

      this.initialized = true;
      console.log("i18next initialized for production");
    } catch (error) {
      console.error("Failed to initialize i18next:", error);
      throw error;
    }
  }
}

export default function createI18nService(): I18nService {
  return new I18nClient();
}
