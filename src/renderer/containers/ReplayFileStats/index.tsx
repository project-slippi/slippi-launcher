import styled from "@emotion/styled";
import ErrorIcon from "@material-ui/icons/Error";
import HelpIcon from "@material-ui/icons/Help";
import { FileResult } from "@replays/types";
import { colors } from "common/colors";
import _ from "lodash";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useReplays } from "@/store/replays";

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

const Footer = styled.div`
  display: inline-block;
  white-space: nowrap;
  padding: 5px;
  color: ${colors.purpleLight};
  background-color: black;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
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

  const keyDownFunction = (event: { keyCode: number }) => {
    // Don't do anything if we're in the middle of processing
    if (loading) {
      return;
    }

    switch (event.keyCode) {
      case 27: // Escape
        props.onClose();
        break;
      case 39: // Right arrow
        props.onNext();
        break;
      case 37: // Left arrow
        props.onPrev();
        break;
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", keyDownFunction, false);
    return () => document.removeEventListener("keydown", keyDownFunction, false);
  }, [keyDownFunction]);

  return (
    <Outer>
      <GameProfileHeader {...props} loading={loading} stats={gameStats} onPlay={() => playFile(fullPath)} />
      <Content>
        {numPlayers !== 2 ? (
          <IconMessage Icon={ErrorIcon} label="Only singles is supported" />
        ) : loading ? (
          <LoadingScreen message={"Crunching numbers..."} />
        ) : error ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`} />
        ) : gameStats ? (
          <GameProfile {...props} stats={gameStats}></GameProfile>
        ) : (
          <IconMessage Icon={HelpIcon} label="No stats computed" />
        )}
      </Content>
      <Footer>{props.file.fullPath}</Footer>
    </Outer>
  );
};
