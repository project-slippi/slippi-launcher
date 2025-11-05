import React from "react";

import { Dropdown } from "@/components/form/dropdown";
import { useServices } from "@/services";

import { SettingItem } from "../../setting_item_section";

export const LanguageSelector = React.memo(() => {
  const { i18nService } = useServices();
  const [currentLanguage, setCurrentLanguage] = React.useState(() => i18nService.currentLanguage);
  const supportedLanguages = i18nService.getSupportedLanguages();

  const handleLanguageChange = React.useCallback(
    (language: string) => {
      void i18nService.setLanguage(language).then(() => {
        setCurrentLanguage(language);
      });
    },
    [i18nService],
  );

  return (
    <SettingItem name="Language" description="Select your preferred language for the interface.">
      <Dropdown value={currentLanguage} options={supportedLanguages} onChange={handleLanguageChange} />
    </SettingItem>
  );
});
