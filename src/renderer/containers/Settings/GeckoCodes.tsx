import type { GeckoCode } from "@dolphin/config/geckoCode";
import { geckoCodeToString, parseGeckoCodes } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import { ContentCopy, DeleteForeverOutlined } from "@mui/icons-material";
import InfoIcon from "@mui/icons-material/Info";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

export const GeckoCodes = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [interactingCode, setInteractingCode] = React.useState<GeckoCode>();
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [tabValue, setTabValue] = React.useState(0);
  const { showError, showSuccess } = useToasts();
  const [codeInput, setCodeInput] = React.useState("");

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

  const openDeleteConfirmation = async (geckoCode: GeckoCode) => {
    setInteractingCode(geckoCode);
    setConfirmationOpen(true);
  };

  const deleteCode = async () => {
    setConfirmationOpen(false);
    setGeckoCodes([...geckoCodes.filter((e) => e !== interactingCode)]);
    setInteractingCode(undefined);
  };

  const copyCode = async (geckoCode: GeckoCode) => {
    await navigator.clipboard.writeText(geckoCodeToString(geckoCode).trim());
    showSuccess("Code copied to clipboard!");
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

    setGeckoCodes([...geckoCodes.concat(parsedCodes)]);
    await saveGeckoCodes(dolphinType, geckoCodes);
    setTabValue(0);
  };

  function geckoCodeItem(geckoCode: GeckoCode) {
    return (
      <ListItem
        key={`code-${geckoCode.name}`}
        css={css`
          display: flex;
          flex-direction: row;
          padding: 1px;
          transform: scale(0.9);
        `}
      >
        <>
          {geckoCode.notes.length > 0 && (
            <Tooltip title={`${geckoCode.notes.join("\n")}`}>
              <InfoIcon htmlColor="#ffffff66" />
            </Tooltip>
          )}
          <Checkbox
            checked={geckoCode.enabled}
            onChange={() => {
              geckoCode.enabled = !geckoCode.enabled;
              setGeckoCodes([...geckoCodes]);
            }}
          />
          {geckoCode.name}
        </>
        <Box
          css={css`
            margin-left: auto;
          `}
        >
          {geckoCode.userDefined && (
            <Tooltip title="Delete Code">
              <IconButton onClick={() => openDeleteConfirmation(geckoCode)}>
                <DeleteForeverOutlined />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Copy to Clipboard">
            <IconButton onClick={() => copyCode(geckoCode)}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
    );
  }

  const TabPanel = (props: React.PropsWithChildren<{ index: number; value: number }>) => {
    const { children, value, index, ...other } = props;

    return (
      <div role="tabpanel" hidden={value !== index} id={`full-width-tabpanel-${index}`} {...other}>
        {value === index && <Box p={3}>{children}</Box>}
      </div>
    );
  };

  const codeList = <List>{geckoCodes.map((c) => geckoCodeItem(c))}</List>;
  const managePanel = (
    <TabPanel value={tabValue} index={0}>
      <Box textAlign="center">
        {codeList}
        <Button color="secondary" fullWidth={true} variant="contained" onClick={saveCodes}>
          Save
        </Button>
      </Box>
    </TabPanel>
  );

  const addPanel = (
    <TabPanel value={tabValue} index={1}>
      <Box textAlign="center">
        <TextField
          type="textarea"
          label="Paste Gecko Codes"
          variant="outlined"
          margin="normal"
          rows="25"
          InputProps={{ style: { fontFamily: '"Space Mono", monospace', fontSize: "12px" } }}
          multiline={true}
          fullWidth={true}
          onChange={(event) => setCodeInput(event.target.value)}
          value={codeInput}
        />
        <Button type="submit" fullWidth={true} variant="contained" color="secondary" onClick={addCode}>
          Add
        </Button>
      </Box>
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
            min-width: 500px;
            max-width: 500px;
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
      <ConfirmationModal
        title="Are you sure you want to delete this code?"
        confirmText="Delete"
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onSubmit={deleteCode}
        fullWidth={false}
      >
        <DialogContentText>The code {interactingCode?.name} will be deleted. This cannot be undone.</DialogContentText>
      </ConfirmationModal>
    </>
  );
};
