import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ErrorIcon from "@mui/icons-material/Error";
import FolderIcon from "@mui/icons-material/Folder";
import HelpIcon from "@mui/icons-material/Help";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import _ from "lodash";
import React from "react";
import { useQuery } from "react-query";

import { BasicFooter } from "@/components/Footer";
import { LoadingScreen } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useMousetrap } from "@/lib/hooks/useMousetrap";
import { getStageImage } from "@/lib/utils";
import { useServices } from "@/services";
import { withFont } from "@/styles/withFont";

import { GameProfile } from "./GameProfile";
import { GameProfileHeader } from "./GameProfileHeader";

const Outer = styled.div<{
  backgroundImage?: any;
}>`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  &::before {
    z-index: -1;
    position: absolute;
    height: 100%;
    width: 100%;
    content: "";
    background-size: cover;
    background-position: center center;
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0 100%),
      ${(p) => (p.backgroundImage ? `url("${p.backgroundImage}")` : "")};
    box-shadow: inset 0 0 2000px rgba(255, 255, 255, 0.2);
    filter: blur(10px);
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: auto;
`;

export interface ReplayFileStatsProps {
  filePath: string;
  file?: FileResult;
  index: number | null;
  total: number | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onPlay: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = (props) => {
  const { filePath } = props;

  const { dolphinService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);
  const gameStatsQuery = useQuery(["loadStatsQuery", filePath], async () => {
    const result = window.electron.replays.calculateGameStats(filePath);
    return result;
  });

  const loading = gameStatsQuery.isLoading;
  const error = gameStatsQuery.error as any;

  const file = gameStatsQuery.data?.file ?? props.file;
  const numPlayers = file?.settings.players.length;
  const gameStats = gameStatsQuery.data?.stats ?? null;

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

  const handleRevealLocation = () => window.electron.shell.showItemInFolder(filePath);

  // We only want to show this full-screen error if we don't have a
  // file in the prop. i.e. the SLP manually opened.
  if (!props.file && error) {
    return (
      <IconMessage Icon={ErrorIcon}>
        <div
          css={css`
            max-width: 800px;
            word-break: break-word;
            text-align: center;
          `}
        >
          <h2>Uh oh. We couldn't open that file. It's probably corrupted.</h2>
          <Button color="secondary" onClick={props.onClose}>
            Go back
          </Button>
        </div>
      </IconMessage>
    );
  }

  if (!file) {
    return <LoadingScreen message="Loading..." />;
  }

  const { settings } = file;
  const stageImage = settings.stageId !== null ? getStageImage(settings.stageId) : undefined;

  return (
    <Outer backgroundImage={stageImage}>
      <GameProfileHeader
        {...props}
        file={file}
        disabled={loading}
        stats={gameStatsQuery.data?.stats ?? null}
        onPlay={props.onPlay}
      />
      <Content>
        {!file || loading ? (
          <LoadingScreen message={"Crunching numbers..."} />
        ) : numPlayers !== 2 ? (
          <IconMessage Icon={ErrorIcon} label="Game stats for doubles is unsupported" />
        ) : error ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`} />
        ) : gameStats ? (
          <GameProfile file={file} stats={gameStats} onPlay={viewReplays} />
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
            `}
          >
            {filePath}
          </div>
        </div>
      </BasicFooter>
    </Outer>
  );
};
