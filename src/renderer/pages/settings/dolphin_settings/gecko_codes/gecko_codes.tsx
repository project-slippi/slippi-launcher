import type { GeckoCode } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import Button from "@mui/material/Button";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { AddCodesContainer } from "./add_codes/add_codes.container";
import { ManageCodesContainer } from "./manage_codes/manage_codes.container";
import { TabbedDialog } from "./tabbed_dialog";

export const GeckoCodes = ({ dolphinType, disabled }: { dolphinType: DolphinLaunchType; disabled: boolean }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [currentTab, setCurrentTab] = React.useState(0);
  const { dolphinService } = useServices();
  const { readGeckoCodes, saveGeckoCodes } = useDolphinActions(dolphinService);
  const { showError } = useToasts();

  const openCodes = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const geckoCodes = await readGeckoCodes(dolphinType);
      if (!geckoCodes) {
        showError("Failed to read gecko codes");
        return;
      }

      setGeckoCodes(geckoCodes);
      setGeckoFormOpen(true);
    } catch (err) {
      showError(`Error reading gecko codes: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [dolphinType, readGeckoCodes, showError]);

  const updateGeckoCodes = React.useCallback(
    async (geckoCodesToSave: GeckoCode[]) => {
      try {
        await saveGeckoCodes(dolphinType, geckoCodesToSave);
        setGeckoCodes(geckoCodesToSave);
      } catch (err) {
        showError(`Error saving gecko codes: ${err}`);
      }
    },
    [dolphinType, saveGeckoCodes, showError],
  );

  const addCode = React.useCallback(
    async (codes: GeckoCode[]) => {
      const newCodesList = geckoCodes.concat(codes);
      await updateGeckoCodes(newCodesList);
      setCurrentTab(0);
    },
    [geckoCodes, updateGeckoCodes],
  );

  const onClose = React.useCallback(() => setGeckoFormOpen(false), []);

  const tabs = React.useMemo((): { name: string; Component: React.ComponentType }[] => {
    const managePage = () => <ManageCodesContainer geckoCodes={geckoCodes} onChange={updateGeckoCodes} />;
    const addPage = () => (
      <AddCodesContainer existingGeckoCodeNames={geckoCodes.map(({ name }) => name)} onSubmit={addCode} />
    );
    return [
      {
        name: "Manage",
        Component: managePage,
      },
      {
        name: "Add",
        Component: addPage,
      },
    ];
  }, [addCode, geckoCodes, updateGeckoCodes]);

  return (
    <>
      <Button variant="contained" color="secondary" onClick={openCodes} disabled={disabled || isLoading}>
        Manage Gecko Codes
      </Button>
      <TabbedDialog
        open={geckoFormOpen}
        onClose={onClose}
        tabs={tabs}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
    </>
  );
};
