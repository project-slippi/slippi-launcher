import { colors } from "@common/colors";
import { slippiHomepage } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React, { useCallback, useMemo } from "react";

import { ExternalLink } from "@/components/ExternalLink";
import { PlayButton, UpdatingButton } from "@/components/play_button/PlayButton";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { useAccount } from "@/lib/hooks/useAccount";
import { useLoginModal } from "@/lib/hooks/useLoginModal";
import { useSettings } from "@/lib/hooks/useSettings";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { useToasts } from "@/lib/hooks/useToasts";
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
  const { dolphinService, slippiBackendService } = useServices();
  const [startGameModalOpen, setStartGameModalOpen] = React.useState(false);
  const [activateOnlineModal, setActivateOnlineModal] = React.useState(false);
  const openModal = useLoginModal((store) => store.openModal);
  const { open } = useSettingsModal();
  const currentUser = useAccount((store) => store.user);
  const userData = useAccount((store) => store.userData);
  const serverError = useAccount((store) => store.serverError);
  const meleeIsoPath = useSettings((store) => store.settings.isoPath) || undefined;
  const { showError } = useToasts();
  const { launchNetplay } = useDolphinActions(dolphinService);

  const onPlay = useCallback(
    async (offlineOnly?: boolean) => {
      if (!offlineOnly) {
        // Ensure user is logged in
        if (!currentUser) {
          setStartGameModalOpen(true);
          return;
        }

        // Ensure user has a valid play key
        if (!userData?.playKey && !serverError) {
          setActivateOnlineModal(true);
          return;
        }

        if (userData?.playKey) {
          // Ensure the play key is saved to disk
          try {
            await slippiBackendService.assertPlayKey(userData.playKey);
          } catch (err) {
            showError(err);
            return;
          }
        }
      }

      if (!meleeIsoPath) {
        showError("No Melee ISO file specified");
        return;
      }

      launchNetplay(offlineOnly ?? false);

      return;
    },
    [currentUser, launchNetplay, meleeIsoPath, userData, serverError, showError, slippiBackendService],
  );

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
          <Button LinkComponent={ExternalLink} href={slippiHomepage} style={isMac ? { marginTop: 10 } : undefined}>
            <img src={slippiLogo} width="38px" />
          </Button>
        </Tooltip>
        <div
          css={css`
            margin: 0 10px;
          `}
        >
          <ConnectedPlayButton onClick={() => onPlay()} />
        </div>
        <MainMenu menuItems={menuItems} />
      </div>
      <Box display="flex" alignItems="center">
        {currentUser ? (
          <UserMenu user={currentUser} handleError={showError} />
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

const ConnectedPlayButton = React.memo(({ onClick }: { onClick: () => void }) => {
  const installStatus = useDolphinStore((store) => store.netplayStatus);
  const installProgress = useDolphinStore((store) => store.netplayDownloadProgress);
  const fillPercent = useMemo(() => {
    if (installStatus === DolphinStatus.READY) {
      return 1;
    }
    if (installProgress && installProgress.total > 0) {
      return installProgress.current / installProgress.total;
    }
    return 0;
  }, [installProgress, installStatus]);

  if (installStatus === DolphinStatus.READY) {
    return <PlayButton onClick={onClick} />;
  }

  return <UpdatingButton onClick={onClick} fillPercent={fillPercent} />;
});
