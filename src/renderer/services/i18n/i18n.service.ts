import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import ICU from "i18next-icu";
import { Subject } from "observable-fns";

import type { I18nService } from "./types";
import { getSystemLanguage, SUPPORTED_LANGUAGES } from "./util";

class I18nClient implements I18nService {
  private readonly localStorageKey = "preferred-language";
  private initialized = false;
  private languageChangeSubject = new Subject<string>();

  constructor(private readonly isDevelopment: boolean) {}

  public onLanguageChange(handle: (language: string) => void): () => void {
    const subscription = this.languageChangeSubject.subscribe(handle);
    return () => subscription.unsubscribe();
  }

  public async setLanguage(language: string): Promise<void> {
    localStorage.setItem(this.localStorageKey, language);
    await i18next.changeLanguage(language);
    // Notify React components that the language has changed
    this.languageChangeSubject.next(language);
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
            loadPath: "./i18n/{{lng}}.json",
          },
          supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.value),
          fallbackLng: "en-US",
          lng: localStorage.getItem(this.localStorageKey) || getSystemLanguage(),
          debug: this.isDevelopment,
        });

      this.initialized = true;
      console.log("i18next initialized");

      // Notify React components of the initial language
      // what happens if we use a language detector and it's not one of the supported languages?
      this.languageChangeSubject.next(i18next.language);
    } catch (error) {
      console.error("Failed to initialize i18next:", error);
      throw error;
    }
  }
}

export default function createI18nService(options: { isDevelopment?: boolean } = {}): I18nService {
  return new I18nClient(options.isDevelopment ?? false);
}
