import type { GeckoCode } from "@dolphin/config/geckoCode";
import { geckoCodeToRaw, rawToGeckoCodes } from "@dolphin/config/geckoCode";
import type { DolphinLaunchType } from "@dolphin/types";
import { ContentCopy, DeleteForeverOutlined } from "@mui/icons-material";
import InfoIcon from "@mui/icons-material/Info";
import {
  Box,
  Button,
  Checkbox,
  css,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

export const GeckoCodes: React.FC<{ dolphinType: DolphinLaunchType }> = ({ dolphinType }) => {
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [interactingCode, setInteractingCode] = React.useState<GeckoCode>();
  const [geckoCodes, setGeckoCodes] = React.useState<GeckoCode[]>([]);
  const [tabValue, setTabValue] = React.useState(0);
  const { showError, showSuccess } = useToasts();
  let rawCodeString = "";

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

  const openDeleteConfirmation = async (c: GeckoCode) => {
    setInteractingCode(c);
    setConfirmationOpen(true);
  };

  const deleteCode = async () => {
    setConfirmationOpen(false);
    setGeckoCodes([...geckoCodes.filter((e) => e !== interactingCode)]);
    setInteractingCode(undefined);
  };

  const handleCodeChange = async (s: string) => {
    rawCodeString = s;
  };

  const copyCode = async (c: GeckoCode) => {
    console.error("why the hell does the following line have whitespace inserted in the beginning??????");
    console.info(c.notes);
    console.log(c);
    await navigator.clipboard.writeText(geckoCodeToRaw(c));
    showSuccess("Code copied to clipboard!");
  };

  const addCode = async () => {
    // attempt to parse the code lines as gecko codes
    const parsedCodes: GeckoCode[] = rawToGeckoCodes(rawCodeString);
    let error = false;

    parsedCodes.forEach((newCode) => {
      if (newCode.name.trim().length === 0) {
        showError("Name is required");
        error = true;
        return;
      } else if (geckoCodes.some((c) => c.name === newCode.name)) {
        showError("Duplicate code name");
        error = true;
        return;
      }
    });

    if (error) {
      return;
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
          <Tooltip
            title={`${geckoCode.notes.join("\n")}`}
            css={css`
              display: ${geckoCode.notes.length ? "" : "nne"};
            `}
          >
            <IconButton disabled={!geckoCode.notes.length}>
              <InfoIcon htmlColor="#ffffff66" />
            </IconButton>
          </Tooltip>
          <Checkbox
            id={`checkbox`}
            checked={geckoCode.enabled}
            css={css``}
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
          <IconButton
            css={css`
              display: ${geckoCode.userDefined === false ? "none" : ""};
            `}
            disabled={geckoCode.userDefined === false}
            onClick={() => openDeleteConfirmation(geckoCode)}
          >
            <DeleteForeverOutlined />
          </IconButton>
          <IconButton onClick={() => copyCode(geckoCode)}>
            <ContentCopy />
          </IconButton>
        </Box>
      </ListItem>
    );
  }

  const codeList = <List>{geckoCodes.map((c) => geckoCodeItem(c))}</List>;
  const managePanel = (
    <TabPanel style={{ alignItems: "center" }} value={tabValue} index={0}>
      <Box textAlign="center">
        {codeList}
        <Button color="secondary" fullWidth variant="contained" onClick={saveCodes}>
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
          id="geckoCode"
          label="Paste Gecko Codes Here"
          variant="outlined"
          margin="normal"
          rows="25"
          InputProps={{ style: { fontFamily: '"Space Mono", monospace', fontSize: "12px" } }}
          multiline
          fullWidth
          onChange={(event) => handleCodeChange(event.target.value)}
        ></TextField>
        <Button type="submit" fullWidth variant="contained" color="secondary" onClick={addCode}>
          Add
        </Button>
      </Box>
    </TabPanel>
  );

  function TabPanel(props: any) {
    const { children, value, index, ...other } = props;

    return (
      <div role="tabpanel" hidden={value !== index} id={`full-width-tabpanel-${index}`} {...other}>
        {value === index && <Box p={3}>{children}</Box>}
      </div>
    );
  }

  const handleTabChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
    event.preventDefault();
    setTabValue(newValue);
  };

  return (
    <div>
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
        <DialogContent>
          <Tabs value={tabValue} variant="fullWidth" onChange={handleTabChange}>
            <Tab label="Manage" />
            <Tab label="Add" />
          </Tabs>
          {managePanel}
          {addPanel}
        </DialogContent>
      </Dialog>
      <Dialog open={confirmationOpen}>
        <DialogTitle>{"Delete code?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <b>{interactingCode?.name}</b>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={async () => {
              setConfirmationOpen(false);
            }}
          >
            No
          </Button>
          <Button
            onClick={async () => {
              await deleteCode();
            }}
            variant="contained"
            autoFocus
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
