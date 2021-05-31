import { launchNetplayDolphin } from "@dolphin/ipc";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Tooltip from "@material-ui/core/Tooltip";
import SettingsIcon from "@material-ui/icons/Settings";
import Alert from "@material-ui/lab/Alert";
import { colors } from "common/colors";
import { shell } from "electron";
import React from "react";
import styled from "styled-components";

import { useLoginModal } from "@/lib/hooks/useLoginModal";
import { useSettings } from "@/lib/hooks/useSettings";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { assertPlayKey } from "@/lib/playkey";
import { useApp } from "@/store/app";

import { UserMenu } from "./UserMenu";

const handleError = (error: any) => {
  const { showSnackbar, dismissSnackbar } = useApp.getState();
  const message = error.message || JSON.stringify(error);
  showSnackbar(
    <Alert onClose={dismissSnackbar} severity="error">
      {message}
    </Alert>,
  );
};

const OuterBox = styled(Box)`
  background-color: ${colors.purpleDark};
  padding: 5px 10px;
`;

const SelectMeleeIsoSnackBar: React.FC<{
  onSettingsClick: () => void;
}> = ({ onSettingsClick }) => {
  return (
    <SnackbarContent
      message={"Please set your Melee ISO path."}
      action={
        <Button color="secondary" size="small" onClick={onSettingsClick}>
          Open Settings
        </Button>
      }
    />
  );
};

const EnableOnlineSnackBar: React.FC = () => {
  return (
    <SnackbarContent
      message={"Please configure your online connect code."}
      action={
        <Button color="secondary" size="small" onClick={() => shell.openExternal("https://slippi.gg/online/enable")}>
          Configure
        </Button>
      }
    />
  );
};

export const Header: React.FC = () => {
  const openModal = useLoginModal((store) => store.openModal);
  const { open } = useSettingsModal();
  const currentUser = useApp((store) => store.user);
  const meleeIsoPath = useSettings((store) => store.settings.isoPath) || undefined;
  const showSnackbar = useApp((state) => state.showSnackbar);
  const dismissSnackbar = useApp((state) => state.dismissSnackbar);

  const onPlay = async () => {
    if (!meleeIsoPath) {
      // Show notification about ISO path not set and link to settings
      showSnackbar(
        <SelectMeleeIsoSnackBar
          onSettingsClick={() => {
            open("/settings/melee-options");
            dismissSnackbar();
          }}
        />,
      );
      return;
    }

    try {
      await assertPlayKey();
    } catch (err) {
      showSnackbar(<EnableOnlineSnackBar />);
      return;
    }

    const launchResult = await launchNetplayDolphin.renderer!.trigger({});
    if (!launchResult.result) {
      console.error("Error launching netplay dolphin", launchResult.errors);
      handleError("Error launching netplay dolphin");
    }
    return;
  };

  return (
    <div>
      <OuterBox display="flex" flexDirection="row" justifyContent="space-between">
        {currentUser ? <Button onClick={onPlay}>Play now</Button> : <Button onClick={openModal}>Log in</Button>}
        <Box display="flex" alignItems="center">
          {currentUser && <UserMenu user={currentUser} handleError={handleError}></UserMenu>}
          <Tooltip title="Settings">
            <IconButton onClick={() => open()}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </OuterBox>
    </div>
  );
};
