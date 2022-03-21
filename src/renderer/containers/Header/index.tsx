import { colors } from "@common/colors";
import { slippiHomepage } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { PlayIcon } from "@/components/PlayIcon";
import { useAccount } from "@/lib/hooks/useAccount";
import { useDolphin } from "@/lib/hooks/useDolphin";
import { useLoginModal } from "@/lib/hooks/useLoginModal";
import { useSettings } from "@/lib/hooks/useSettings";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { useServices } from "@/services";
import slippiLogo from "@/styles/images/slippi-logo.svg";
import { platformTitleBarStyles } from "@/styles/platformTitleBarStyles";

import { ActivateOnlineDialog } from "./ActivateOnlineDialog";
import type { MenuItem } from "./MainMenu";
import { MainMenu } from "./MainMenu";
import { StartGameDialog } from "./StartGameDialog";
import { UserMenu } from "./UserMenu";

const isMac = window.electron.common.isMac;

const OuterBox = styled(Box)`
  background: radial-gradient(circle at left, #5c1394, transparent 30%);
  background-color: ${colors.purple};
  height: 70px;
`;
export interface HeaderProps {
  menuItems: MenuItem[];
}

export const Header: React.FC<HeaderProps> = ({ menuItems }) => {
  const { slippiBackendService } = useServices();
  const [startGameModalOpen, setStartGameModalOpen] = React.useState(false);
  const [activateOnlineModal, setActivateOnlineModal] = React.useState(false);
  const openModal = useLoginModal((store) => store.openModal);
  const { open } = useSettingsModal();
  const currentUser = useAccount((store) => store.user);
  const playKey = useAccount((store) => store.playKey);
  const serverError = useAccount((store) => store.serverError);
  const meleeIsoPath = useSettings((store) => store.settings.isoPath) || undefined;
  const { addToast } = useToasts();
  const { launchNetplay } = useDolphin();

  const handleError = (err: any) => addToast(err.message ?? JSON.stringify(err), { appearance: "error" });

  const onPlay = async (offlineOnly?: boolean) => {
    if (!offlineOnly) {
      // Ensure user is logged in
      if (!currentUser) {
        setStartGameModalOpen(true);
        return;
      }

      // Ensure user has a valid play key
      if (!playKey && !serverError) {
        setActivateOnlineModal(true);
        return;
      }

      if (playKey) {
        // Ensure the play key is saved to disk
        try {
          await slippiBackendService.assertPlayKey(playKey);
        } catch (err) {
          handleError(err);
          return;
        }
      }
    }

    if (!meleeIsoPath) {
      handleError("No Melee ISO file specified");
      return;
    }

    launchNetplay(offlineOnly ?? false);

    return;
  };

  return (
    <OuterBox
      css={css`
        display: flex;
        justify-content: space-between;
        ${platformTitleBarStyles()}
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          padding-left: 5px;
        `}
      >
        <Tooltip title="Open Slippi.gg">
          <Button
            onClick={() => window.electron.shell.openPath(slippiHomepage)}
            style={isMac ? { marginTop: 10 } : undefined}
          >
            <img src={slippiLogo} width="38px" />
          </Button>
        </Tooltip>
        <div
          css={css`
            margin: 0 10px;
          `}
        >
          <ButtonBase onClick={() => onPlay()}>
            <PlayIcon
              css={css`
                &:hover {
                  opacity: 0.8;
                  transition: opacity 0.2s ease-in-out;
                }
              `}
            >
              Play
            </PlayIcon>
          </ButtonBase>
        </div>
        <MainMenu menuItems={menuItems} />
      </div>
      <Box display="flex" alignItems="center">
        {currentUser ? (
          <UserMenu user={currentUser} handleError={handleError} />
        ) : (
          <Button onClick={openModal} sx={{ color: "white" }}>
            Log in
          </Button>
        )}
        <Tooltip title="Settings">
          <IconButton
            onClick={() => open()}
            css={css`
              opacity: 0.5;
              margin-right: 10px;
            `}
            size="large"
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <StartGameDialog
        open={startGameModalOpen}
        onClose={() => setStartGameModalOpen(false)}
        onSubmit={() => onPlay(true)}
      />
      <ActivateOnlineDialog
        open={activateOnlineModal}
        onClose={() => setActivateOnlineModal(false)}
        onSubmit={() => onPlay()}
      />
    </OuterBox>
  );
};
