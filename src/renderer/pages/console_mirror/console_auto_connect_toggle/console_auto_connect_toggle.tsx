import { css } from "@emotion/react";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import React from "react";

import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useEnableConsoleAutoConnect } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";

import { ConsoleMirrorMessages as Messages } from "../console_mirror.messages";

export const ConsoleAutoConnectToggle = () => {
  const [enableConsoleAutoConnect, setEnableConsoleAutoConnect] = useEnableConsoleAutoConnect();
  const clearConsoleAutoConnectOptOuts = useConsoleDiscoveryStore((store) => store.clearConsoleAutoConnectOptOuts);
  const { showError } = useToasts();
  const [modalOpen, setModalOpen] = React.useState(false);

  const onToggle = (checked: boolean) => {
    // Re-enabling clears manual disconnects so all available consoles reconnect.
    if (checked) {
      clearConsoleAutoConnectOptOuts();
    }
    setEnableConsoleAutoConnect(checked).catch(showError);
  };

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
      `}
    >
      <FormControlLabel
        labelPlacement="start"
        control={
          <Switch
            checked={enableConsoleAutoConnect}
            onChange={(e) => onToggle(e.target.checked)}
            color="primary"
            size="small"
          />
        }
        label={Messages.consoleAutoConnect()}
        sx={{ margin: 0 }}
        css={css`
          .MuiFormControlLabel-label {
            font-size: 12px;
            margin-right: 8px;
          }
        `}
      />
      <IconButton
        onClick={() => setModalOpen(true)}
        size="small"
        css={css`
          opacity: 0.5;
        `}
      >
        <HelpOutline
          css={css`
            font-size: 18px;
          `}
        />
      </IconButton>
      <Dialog open={modalOpen} closeAfterTransition={true} onClose={() => setModalOpen(false)}>
        <DialogTitle>{Messages.whatIsConsoleAutoConnect()}</DialogTitle>
        <DialogContent>
          <p>{Messages.consoleAutoConnectDescription()}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
