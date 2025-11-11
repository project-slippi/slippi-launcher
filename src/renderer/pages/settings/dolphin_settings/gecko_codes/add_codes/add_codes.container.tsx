import type { GeckoCode } from "@dolphin/config/gecko_code";
import { parseGeckoCodes } from "@dolphin/config/gecko_code";

import { AddCodes } from "./add_codes";
import { AddCodesMessages as Messages } from "./add_codes.messages";

export const AddCodesContainer = ({
  existingGeckoCodeNames = [],
  onSubmit,
}: {
  existingGeckoCodeNames?: string[];
  onSubmit: (codes: GeckoCode[]) => void;
}) => {
  const onFormSubmit = (geckoCodeInput: string) => {
    const parsedCodes = parseGeckoCodes(geckoCodeInput.split("\n"), { enabled: true, userDefined: true });
    onSubmit(parsedCodes);
  };

  return (
    <AddCodes
      validateCodeInput={(input: string) => validateGeckoCode(input, existingGeckoCodeNames)}
      onSubmit={onFormSubmit}
    />
  );
};

const validateGeckoCode = (codeInput: string, existingGeckoCodeNames: string[] = []): string | true => {
  // Attempt to parse the code lines as gecko codes
  const parsedCodes: GeckoCode[] = parseGeckoCodes(codeInput.split("\n"));
  if (parsedCodes.length === 0) {
    return Messages.invalidGeckoCode();
  }

  for (const newCode of parsedCodes) {
    if (newCode.name.trim().length === 0) {
      return Messages.nameRequired();
    } else if (existingGeckoCodeNames.includes(newCode.name)) {
      return Messages.duplicateCodeName();
    }
  }

  return true;
};
