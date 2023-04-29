import type { GeckoCode } from "@dolphin/config/geckoCode";
import { geckoCodeToString } from "@dolphin/config/geckoCode";

import { useToasts } from "@/lib/hooks/useToasts";

import { ManageCodes } from "./ManageCodes";

export const ManageCodesContainer = ({
  geckoCodes,
  onChange,
  onSave,
}: {
  geckoCodes: GeckoCode[];
  onChange: (codes: GeckoCode[]) => void;
  onSave: () => void;
}) => {
  const { showSuccess } = useToasts();

  const handleDelete = (geckoCode: GeckoCode) => {
    onChange(geckoCodes.filter((e) => e !== geckoCode));
  };

  const handleCopy = (geckoCode: GeckoCode) => {
    window.electron.clipboard.writeText(geckoCodeToString(geckoCode).trim());
    showSuccess("Code copied to clipboard!");
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
      onSave={onSave}
    />
  );
};
