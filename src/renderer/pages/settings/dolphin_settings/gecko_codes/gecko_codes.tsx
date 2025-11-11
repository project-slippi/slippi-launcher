import type { GeckoCode } from "@dolphin/config/gecko_code";
import type { DolphinLaunchType } from "@dolphin/types";
import Button from "@mui/material/Button";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { AddCodesContainer } from "./add_codes/add_codes.container";
import { GeckoCodesMessages as Messages } from "./gecko_codes.messages";
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
        showError(Messages.failedToReadGeckoCodes());
        return;
      }

      setGeckoCodes(geckoCodes);
      setGeckoFormOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      showError(Messages.errorReadingGeckoCodes(errorMessage));
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
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        showError(Messages.errorSavingGeckoCodes(errorMessage));
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
        name: Messages.manage(),
        Component: managePage,
      },
      {
        name: Messages.add(),
        Component: addPage,
      },
    ];
  }, [addCode, geckoCodes, updateGeckoCodes]);

  return (
    <>
      <Button variant="contained" color="secondary" onClick={openCodes} disabled={disabled || isLoading}>
        {Messages.manageGeckoCodes()}
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
