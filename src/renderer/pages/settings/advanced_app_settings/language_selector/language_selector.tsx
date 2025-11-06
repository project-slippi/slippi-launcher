import React from "react";

import { Dropdown } from "@/components/form/dropdown";
import { useAppStore } from "@/lib/hooks/use_app";
import { useServices } from "@/services";

import { SettingItem } from "../../setting_item_section";
import { LanguageSelectorMessages as Messages } from "./language_selector.messages";

export const LanguageSelector = React.memo(() => {
  const { i18nService } = useServices();
  const currentLanguage = useAppStore((state) => state.currentLanguage);
  const supportedLanguages = i18nService.getSupportedLanguages();

  const handleLanguageChange = React.useCallback(
    (language: string) => {
      void i18nService.setLanguage(language);
    },
    [i18nService],
  );

  return (
    <SettingItem name={Messages.appLanguage()} description={Messages.appLanguageDescription()}>
      <Dropdown value={currentLanguage} options={supportedLanguages} onChange={handleLanguageChange} />
    </SettingItem>
  );
});
