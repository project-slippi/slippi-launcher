import React from "react";

import { LanguageSelector } from "./language_selector/language_selector";

export const LanguageSettings = React.memo(() => {
  return (
    <div>
      <LanguageSelector />
    </div>
  );
});
