/** @jsx jsx */
import { ipc_copyDolphin } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import * as fs from "fs-extra";
import path from "path";
import React from "react";

import { Button } from "@/components/FormInputs/Button";
import { useDesktopApp } from "@/lib/hooks/useQuickStart";

import { QuickStartHeader } from "./QuickStartHeader";

export const MigrateDolphinStep: React.FC = () => {
  const [oldDesktopAppPath, setExists] = useDesktopApp((store) => [store.path, store.setExists]);
  const oldDesktopDolphin = path.join(oldDesktopAppPath, "dolphin");
  const deleteOldDesktopAppFolder = async () => {
    await fs.remove(oldDesktopAppPath);
    setExists(false);
  };
  const migratePlaybackDolphin = async () => {
    await ipc_copyDolphin.renderer!.trigger({ dolphinType: DolphinLaunchType.PLAYBACK, userPath: oldDesktopDolphin });
    // await deleteOldDesktopAppFolder();
  };
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Migrate Dolphin</QuickStartHeader>
        <div>We found an old installation of the Slippi Desktop App, would you like to migrate Dolphin?</div>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: auto;
            margin-right: auto;
            margin-top: 50px;
            max-width: 400px;
          `}
        >
          <Button variant="contained" color="primary" onClick={migratePlaybackDolphin}>
            Yes
          </Button>
          <Button
            color="secondary"
            onClick={deleteOldDesktopAppFolder}
            css={css`
              text-transform: initial;
              margin-top: 10px;
            `}
          >
            No
          </Button>
        </div>
      </Container>
    </Box>
  );
};
