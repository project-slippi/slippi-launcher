import React from "react";

import { LanguageSelector } from "./language_selector/language_selector";

export const AppearanceSettings = React.memo(() => {
  return (
    <div>
      <LanguageSelector />
    </div>
  );
});
