import _ from "lodash";
import { useReplays } from "@/store/replays";
import { FileResult } from "common/replayBrowser";
import React from "react";
import HelpIcon from "@material-ui/icons/Help";
import ErrorIcon from "@material-ui/icons/Error";
import { GameProfile } from "./GameProfile";
import { LoadingScreen } from "@/components/LoadingScreen";
import styled from "styled-components";
import { GameProfileHeader } from "./GameProfileHeader";
import { IconMessage } from "@/components/Message";

const Outer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
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
  const { settings } = props.file;

  const loading = useReplays((store) => store.selectedFile.loading);
  const error = useReplays((store) => store.selectedFile.error);
  const gameStats = useReplays((store) => store.selectedFile.gameStats);
  const numPlayers = settings.players.length;

  return (
    <Outer>
      <GameProfileHeader
        {...props}
        loading={loading}
        stats={gameStats}
        onPlay={() =>
          console.warn("Playing back replays is currently unsupported")
        }
      />
      {numPlayers !== 2 ? (
        <IconMessage Icon={ErrorIcon} label="Only singles is supported" />
      ) : loading ? (
        <LoadingScreen message={"Crunching numbers..."} />
      ) : error ? (
        <IconMessage
          Icon={ErrorIcon}
          label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`}
        />
      ) : gameStats ? (
        <GameProfile {...props} stats={gameStats}></GameProfile>
      ) : (
        <IconMessage Icon={HelpIcon} label="No stats computed" />
      )}
    </Outer>
  );
};
