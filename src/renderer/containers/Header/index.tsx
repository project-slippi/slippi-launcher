/** @jsx jsx */
import { launchNetplayDolphin } from "@dolphin/ipc";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import { colors } from "common/colors";
import { slippiHomepage } from "common/constants";
import { shell } from "electron";
import log from "electron-log";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { PlayIcon } from "@/components/PlayIcon";
import { useAccount } from "@/lib/hooks/useAccount";
import { useLoginModal } from "@/lib/hooks/useLoginModal";
import { useSettings } from "@/lib/hooks/useSettings";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { assertPlayKey } from "@/lib/slippiBackend";
import slippiLogo from "@/styles/images/slippi-logo.svg";

import { ActivateOnlineDialog } from "./ActivateOnlineDialog";
import { MainMenu, MenuItem } from "./MainMenu";
import { StartGameDialog } from "./StartGameDialog";
import { UserMenu } from "./UserMenu";

const OuterBox = styled(Box)`
  background: radial-gradient(circle at left, #5c1394, transparent 30%);
  background-color: ${colors.purple};
  height: 70px;
`;
export interface HeaderProps {
  path: string;
  menuItems: MenuItem[];
}

export const Header: React.FC<HeaderProps> = ({ path, menuItems }) => {
  const [startGameModalOpen, setStartGameModalOpen] = React.useState(false);
  const [activateOnlineModal, setActivateOnlineModal] = React.useState(false);
  const openModal = useLoginModal((store) => store.openModal);
  const { open } = useSettingsModal();
  const currentUser = useAccount((store) => store.user);
  const playKey = useAccount((store) => store.playKey);
  const meleeIsoPath = useSettings((store) => store.settings.isoPath) || undefined;
  const { addToast } = useToasts();

  const handleError = (err: any) => addToast(err.message ?? JSON.stringify(err), { appearance: "error" });

  const onPlay = async (offlineOnly?: boolean) => {
    if (!offlineOnly) {
      // Ensure user is logged in
      if (!currentUser) {
        setStartGameModalOpen(true);
        return;
      }

      // Ensure user has a valid play key
      if (!playKey) {
        setActivateOnlineModal(true);
        return;
      }

      // Ensure the play key is saved to disk
      try {
        await assertPlayKey(playKey);
      } catch (err) {
        handleError(err.message);
        return;
      }
    }

    if (!meleeIsoPath) {
      handleError("No Melee ISO file specified");
      return;
    }

    try {
      const launchResult = await launchNetplayDolphin.renderer!.trigger({});
      if (!launchResult.result) {
        log.info("Error launching netplay dolphin", launchResult.errors);
        throw new Error("Error launching netplay dolphin");
      }
    } catch (err) {
      handleError(err.message);
      return;
    }

    return;
  };

  return (
    <OuterBox
      css={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <Tooltip title="Open Slippi.gg">
          <Button onClick={() => shell.openExternal(slippiHomepage)}>
            <img src={slippiLogo} width="43px" />
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
        <MainMenu path={path} menuItems={menuItems} />
      </div>
      <Box display="flex" alignItems="center">
        {currentUser ? (
          <UserMenu user={currentUser} handleError={handleError} />
        ) : (
          <Button onClick={openModal}>Log in</Button>
        )}
        <Tooltip title="Settings">
          <IconButton
            onClick={() => open()}
            css={css`
              opacity: 0.5;
            `}
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
