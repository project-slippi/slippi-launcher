import type { GeckoCode } from "@dolphin/config/geckoCode";
import { parseGeckoCodes } from "@dolphin/config/geckoCode";
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

import { AddCodes } from "./AddCodes/AddCodes";
import { ManageCodesContainer } from "./ManageCodes/ManageCodes.container";

export const GeckoCodes = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [codeInput, setCodeInput] = React.useState("");
  const [tabValue, setTabValue] = React.useState(0);
  const { showError } = useToasts();
  const { dolphinService } = useServices();
  const { readGeckoCodes, saveGeckoCodes } = useDolphinActions(dolphinService);

  const openCodes = async () => {
    const geckoCodes = await readGeckoCodes(dolphinType);
    if (!geckoCodes) {
      console.error("Failed to read gecko codes");
      return;
    }

    setGeckoCodes(geckoCodes);
    setGeckoFormOpen(true);
  };

  const saveCodes = async () => {
    await saveGeckoCodes(dolphinType, geckoCodes);
    setGeckoFormOpen(false);
  };

  const addCode = async () => {
    // attempt to parse the code lines as gecko codes
    const parsedCodes: GeckoCode[] = parseGeckoCodes(codeInput.split("\n"));

    for (const newCode of parsedCodes) {
      if (newCode.name.trim().length === 0) {
        showError("Name is required");
        return;
      } else if (geckoCodes.some((c) => c.name === newCode.name)) {
        showError("Duplicate code name");
        return;
      }
    }

    setGeckoCodes(geckoCodes.concat(parsedCodes));
    await saveGeckoCodes(dolphinType, geckoCodes);
    setTabValue(0);
  };

  const handleTabChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
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
        onClose={() => {
          setGeckoFormOpen(false);
        }}
        maxWidth="md"
        fullWidth={true}
      >
        <DialogTitle sx={{ padding: 0 }}>
          <Tabs value={tabValue} variant="fullWidth" onChange={handleTabChange}>
            <Tab label="Manage" />
            <Tab label="Add" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <TabPanel value={tabValue} index={0}>
            <ManageCodesContainer geckoCodes={geckoCodes} onChange={setGeckoCodes} onSave={saveCodes} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AddCodes value={codeInput} onChange={setCodeInput} onSubmit={addCode} />
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
