import type { GeckoCode } from "@dolphin/config/gecko_code";
import { geckoCodeToString } from "@dolphin/config/gecko_code";

import { useToasts } from "@/lib/hooks/use_toasts";

import { ManageCodes } from "./manage_codes";

export const ManageCodesContainer = ({
  geckoCodes,
  onChange,
}: {
  geckoCodes: GeckoCode[];
  onChange: (codes: GeckoCode[]) => void;
}) => {
  const { showSuccess } = useToasts();

  const handleDelete = (geckoCode: GeckoCode) => {
    onChange(geckoCodes.filter((e) => e !== geckoCode));
  };

  const handleCopy = (geckoCode: GeckoCode) => {
    navigator.clipboard
      .writeText(geckoCodeToString(geckoCode).trim())
      .then(() => {
        showSuccess("Code copied to clipboard!");
      })
      .catch(console.error);
  };

  const handleToggle = (code: GeckoCode) => {
    const index = geckoCodes.findIndex((c) => c.name === code.name);
    if (index !== -1) {
      const geckoCode = geckoCodes[index];
      geckoCode.enabled = !geckoCode.enabled;
      geckoCodes[index] = geckoCode;
      onChange([...geckoCodes]);
    }
  };

  return (
    <ManageCodes
      geckoCodes={geckoCodes}
      handleToggle={handleToggle}
      handleCopy={handleCopy}
      handleDelete={handleDelete}
    />
  );
};
