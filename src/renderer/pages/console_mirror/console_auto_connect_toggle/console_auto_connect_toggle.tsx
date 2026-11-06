import { css } from "@emotion/react";
import HelpOutline from "@mui/icons-material/HelpOutline";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";

import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useEnableConsoleAutoConnect } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";

import { ConsoleMirrorMessages as Messages } from "../console_mirror.messages";

export const ConsoleAutoConnectToggle = () => {
  const [enableConsoleAutoConnect, setEnableConsoleAutoConnect] = useEnableConsoleAutoConnect();
  const clearConsoleAutoConnectOptOuts = useConsoleDiscoveryStore((store) => store.clearConsoleAutoConnectOptOuts);
  const { showError } = useToasts();

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
      <Tooltip title={Messages.consoleAutoConnectDescription()}>
        <HelpOutline
          css={css`
            font-size: 18px;
            opacity: 0.5;
            cursor: help;
          `}
        />
      </Tooltip>
    </div>
  );
};
