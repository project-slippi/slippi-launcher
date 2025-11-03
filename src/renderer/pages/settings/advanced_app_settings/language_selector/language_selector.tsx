import React from "react";

import { Dropdown } from "@/components/form/dropdown";
import { SettingItem } from "../../setting_item_section";
import { useServices } from "@/services";

const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
];

export const LanguageSelector = React.memo(() => {
  const { i18nService } = useServices();
  const [currentLanguage, setCurrentLanguage] = React.useState(() => i18nService.currentLanguage);
  
  const handleLanguageChange = React.useCallback(
    (language: string) => {
      i18nService.setLanguage(language).then(() => {
        setCurrentLanguage(language);
      });
    },
    [i18nService]
  );

  return (
    <SettingItem 
      name="Language" 
      description="Select your preferred language for the interface."
    >
      <Dropdown
        value={currentLanguage}
        options={SUPPORTED_LANGUAGES}
        onChange={handleLanguageChange}
      />
    </SettingItem>
  );
});
