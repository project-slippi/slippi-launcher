import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import { useTheme } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import SettingsIcon from "@material-ui/icons/Settings";
import Alert from "@material-ui/lab/Alert";
import { colors } from "common/colors";
import { shell } from "electron";
import React from "react";
import styled from "styled-components";

import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { assertPlayKey } from "@/lib/playkey";
import { startGame } from "@/lib/startDolphin";
import { useApp } from "@/store/app";
import { useSettings } from "@/store/settings";

import { LoginForm } from "../LoginForm";
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
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const { open } = useSettingsModal();
  const currentUser = useApp((store) => store.user);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
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

    try {
      await startGame(console.log, meleeIsoPath);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      <OuterBox display="flex" flexDirection="row" justifyContent="space-between">
        {currentUser ? (
          <Button onClick={onPlay}>Play now</Button>
        ) : (
          <Button onClick={() => setLoginModalOpen(true)}>Log in</Button>
        )}
        <Box display="flex" alignItems="center">
          {currentUser && <UserMenu user={currentUser} handleError={handleError}></UserMenu>}
          <Tooltip title="Settings">
            <IconButton onClick={() => open()}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </OuterBox>
      <Dialog open={loginModalOpen} onClose={() => setLoginModalOpen(false)} fullWidth={true} fullScreen={fullScreen}>
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <LoginForm onSuccess={() => setLoginModalOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginModalOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
