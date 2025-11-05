import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import ICU from "i18next-icu";

import type { I18nService } from "./types";

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

  public async init(): Promise<void> {
    // In development mode, we don't use auto-keys transformation,
    // so we only need basic i18next setup for language switching
    if (process.env.NODE_ENV === "development") {
      if (this.initialized && i18next.isInitialized) {
        console.log("i18next already initialized (dev mode)");
        return;
      }

      // Simple setup for development - just language switching, no translation loading
      await i18next.use(ICU).init({
        fallbackLng: this.defaultLanguage,
        lng: localStorage.getItem(this.localStorageKey) || this.defaultLanguage,
        debug: false,
        resources: {}, // No resources needed in dev mode
      });

      this.initialized = true;
      console.log("i18next initialized for development");
      return;
    }

    // Production mode - full i18next with auto-generated translations
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

          // Handle missing keys gracefully
          returnEmptyString: false,
          returnNull: false,
          saveMissing: false,

          missingKeyHandler: (_lng, _ns, key, fallbackValue) => {
            console.warn(`Missing translation for key: ${key}`);
            return fallbackValue || key;
          },
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
