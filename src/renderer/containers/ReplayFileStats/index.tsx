/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import ErrorIcon from "@material-ui/icons/Error";
import FolderIcon from "@material-ui/icons/Folder";
import HelpIcon from "@material-ui/icons/Help";
import { FileResult } from "@replays/types";
import { colors } from "common/colors";
import { shell } from "electron";
import _ from "lodash";
import React from "react";

import { BasicFooter } from "@/components/BasicFooter";
import { LoadingScreen } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useMousetrap } from "@/lib/hooks/useMousetrap";
import { useReplays } from "@/store/replays";
import { withFont } from "@/styles/withFont";

import { GameProfile } from "./GameProfile";
import { GameProfileHeader } from "./GameProfileHeader";

const Outer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: auto;
`;

export interface ReplayFileStatsProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = (props) => {
  const { settings, fullPath } = props.file;

  const loading = useReplays((store) => store.selectedFile.loading);
  const error = useReplays((store) => store.selectedFile.error);
  const gameStats = useReplays((store) => store.selectedFile.gameStats);
  const playFile = useReplays((store) => store.playFile);
  const numPlayers = settings.players.length;

  // Add key bindings
  useMousetrap("escape", () => {
    if (!loading) {
      props.onClose();
    }
  });
  useMousetrap("left", () => {
    if (!loading) {
      props.onPrev();
    }
  });
  useMousetrap("right", () => {
    if (!loading) {
      props.onNext();
    }
  });

  const handleRevealLocation = () => shell.showItemInFolder(props.file.fullPath);

  return (
    <Outer>
      <GameProfileHeader {...props} loading={loading} stats={gameStats} onPlay={() => playFile(fullPath)} />
      <Content>
        {numPlayers !== 2 ? (
          <IconMessage Icon={ErrorIcon} label="Game stats for doubles is unsupported" />
        ) : loading ? (
          <LoadingScreen message={"Crunching numbers..."} />
        ) : error ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`} />
        ) : gameStats ? (
          <GameProfile {...props} stats={gameStats} settings={settings}></GameProfile>
        ) : (
          <IconMessage Icon={HelpIcon} label="No stats computed" />
        )}
      </Content>
      <BasicFooter>
        <Tooltip title="Reveal location">
          <IconButton onClick={handleRevealLocation} size="small">
            <FolderIcon
              css={css`
                color: ${colors.purpleLight};
              `}
            />
          </IconButton>
        </Tooltip>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: 10px;
            padding-right: 20px;
          `}
        >
          <div
            css={css`
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 4px;
              text-transform: uppercase;
              font-family: ${withFont("Maven Pro")};
            `}
          >
            Current File
          </div>
          <div
            css={css`
              color: white;
              font-weight: lighter;
            `}
          >
            {props.file.fullPath}
          </div>
        </div>
      </BasicFooter>
    </Outer>
  );
};
