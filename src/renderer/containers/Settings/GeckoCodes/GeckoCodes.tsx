import type { GeckoCode } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { AddCodesContainer } from "./AddCodes/AddCodes.container";
import { ManageCodesContainer } from "./ManageCodes/ManageCodes.container";

export const GeckoCodes = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [tabValue, setTabValue] = React.useState(0);
  const { dolphinService } = useServices();
  const { readGeckoCodes, saveGeckoCodes } = useDolphinActions(dolphinService);
  const { showError } = useToasts();

  const openCodes = async () => {
    const geckoCodes = await readGeckoCodes(dolphinType);
    if (!geckoCodes) {
      showError("Failed to read gecko codes");
      return;
    }

    setGeckoCodes(geckoCodes);
    setGeckoFormOpen(true);
  };

  const updateGeckoCodes = async (geckoCodesToSave: GeckoCode[]) => {
    try {
      await saveGeckoCodes(dolphinType, geckoCodesToSave);
      setGeckoCodes(geckoCodesToSave);
    } catch (err) {
      showError(`Error saving gecko codes: ${err}`);
    }
  };

  const addCode = async (codes: GeckoCode[]) => {
    const newCodesList = geckoCodes.concat(codes);
    await updateGeckoCodes(newCodesList);
    setTabValue(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setTabValue(newValue);
  };

  return (
    <>
      <Button variant="contained" color="secondary" onClick={openCodes}>
        Manage Gecko Codes
      </Button>
      <Dialog
        open={geckoFormOpen}
        maxWidth="md"
        fullWidth={true}
        onClose={() => {
          setGeckoFormOpen(false);
        }}
      >
        <DialogTitle sx={{ padding: 0 }}>
          <Tabs value={tabValue} variant="fullWidth" onChange={handleTabChange}>
            <Tab label="Manage" />
            <Tab label="Add" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <TabPanel value={tabValue} index={0}>
            <ManageCodesContainer geckoCodes={geckoCodes} onChange={updateGeckoCodes} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AddCodesContainer existingGeckoCodeNames={geckoCodes.map(({ name }) => name)} onSubmit={addCode} />
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
};

const TabPanel = ({ value, index, children }: React.PropsWithChildren<{ index: number; value: number }>) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      css={css`
        height: 70vh;
      `}
    >
      {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
    </div>
  );
};
