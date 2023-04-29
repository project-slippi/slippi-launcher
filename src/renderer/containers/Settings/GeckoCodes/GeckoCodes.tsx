import type { GeckoCode } from "@dolphin/config/geckoCode";
import { geckoCodeToString, parseGeckoCodes } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { AddCodes } from "./AddCodes/AddCodes";
import { ManageCodes } from "./ManageCodes/ManageCodes";

export const GeckoCodes = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [tabValue, setTabValue] = React.useState(0);
  const { showError, showSuccess } = useToasts();

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

  const deleteCode = (geckoCode: GeckoCode) => {
    setGeckoCodes([...geckoCodes.filter((e) => e !== geckoCode)]);
  };

  const copyCode = async (geckoCode: GeckoCode) => {
    await navigator.clipboard.writeText(geckoCodeToString(geckoCode).trim());
    showSuccess("Code copied to clipboard!");
  };

  const addCode = async (codeInput: string) => {
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

    setGeckoCodes([...geckoCodes.concat(parsedCodes)]);
    await saveGeckoCodes(dolphinType, geckoCodes);
    setTabValue(0);
  };

  const handleToggle = (code: GeckoCode) => {
    const index = geckoCodes.findIndex((c) => c.name === code.name);
    if (index !== -1) {
      const geckoCode = geckoCodes[index];
      geckoCode.enabled = !geckoCode.enabled;
      geckoCodes[index] = geckoCode;
      setGeckoCodes([...geckoCodes]);
    }
  };

  const managePanel = (
    <TabPanel value={tabValue} index={0}>
      <ManageCodes
        geckoCodes={geckoCodes}
        handleToggle={handleToggle}
        handleCopy={copyCode}
        handleDelete={deleteCode}
        onSave={saveCodes}
      />
    </TabPanel>
  );

  const addPanel = (
    <TabPanel value={tabValue} index={1}>
      <AddCodes onSubmit={(value) => addCode(value)} />
    </TabPanel>
  );

  const handleTabChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
    event.preventDefault();
    setTabValue(newValue);
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        css={css`
          min-width: 145px;
        `}
        onClick={openCodes}
      >
        Manage Gecko Codes
      </Button>
      <Dialog
        open={geckoFormOpen}
        onClose={() => {
          setGeckoFormOpen(false);
        }}
      >
        <DialogContent
          css={css`
            width: 500px;
          `}
        >
          <Tabs value={tabValue} variant="fullWidth" onChange={handleTabChange}>
            <Tab label="Manage" />
            <Tab label="Add" />
          </Tabs>
          {managePanel}
          {addPanel}
        </DialogContent>
      </Dialog>
    </>
  );
};

const TabPanel = ({ value, index, children }: React.PropsWithChildren<{ index: number; value: number }>) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};
