import type { GeckoCode } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import Button from "@mui/material/Button";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { AddCodesContainer } from "./AddCodes/AddCodes.container";
import { ManageCodesContainer } from "./ManageCodes/ManageCodes.container";
import { TabbedDialog } from "./TabbedDialog";

export const GeckoCodes = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [tabValue, setTabValue] = React.useState(0);
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
      setTabValue(0);
    },
    [geckoCodes, updateGeckoCodes],
  );

  const onClose = React.useCallback(() => setGeckoFormOpen(false), []);

  const tabs = React.useMemo((): { name: string; Component: React.ComponentType }[] => {
    return [
      {
        name: "Manage",
        Component: () => <ManageCodesContainer geckoCodes={geckoCodes} onChange={updateGeckoCodes} />,
      },
      {
        name: "Add",
        Component: () => (
          <AddCodesContainer existingGeckoCodeNames={geckoCodes.map(({ name }) => name)} onSubmit={addCode} />
        ),
      },
    ];
  }, [addCode, geckoCodes, updateGeckoCodes]);

  return (
    <>
      <Button variant="contained" color="secondary" onClick={openCodes} disabled={isLoading}>
        Manage Gecko Codes
      </Button>
      <TabbedDialog
        open={geckoFormOpen}
        onClose={onClose}
        tabs={tabs}
        currentTab={tabValue}
        setCurrentTab={setTabValue}
      />
    </>
  );
};
