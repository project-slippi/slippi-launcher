import { exists } from "@common/exists";
import { css } from "@emotion/react";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import SportsCricket from "@mui/icons-material/SportsCricket";
import TimerIcon from "@mui/icons-material/Timer";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import type { FileResult } from "@replays/types";
import { frameToGameTimer, GameMode, stages as stageUtils } from "@slippi/slippi-js";
import groupBy from "lodash/groupBy";
import React, { useCallback, useMemo } from "react";

import { useReplays } from "@/lib/hooks/use_replays";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";
import { getStageImage } from "@/lib/utils";

import { DraggableFile } from "./draggable_file";
import type { ReplayDetail, ReplayFileAction } from "./replay_file";
import { ReplayFile as ReplayFileImpl } from "./replay_file";
import { ReplayFileMessages as Messages } from "./replay_file.messages";
import type { PlayerInfo } from "./team_elements/team_elements";
import { useFileDrag } from "./use_file_drag";

type ReplayFileContainerProps = FileResult & {
  index: number;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onClick: (index: number, isShiftHeld: boolean) => void;
  selectedFilesSet: Set<string>;
};

export const ReplayFileContainer = React.memo(function ReplayFileContainer({
  index,
  onOpenMenu,
  onSelect,
  onPlay,
  onClick,
  id,
  fileName,
  game,
  fullPath,
  selectedFilesSet,
}: ReplayFileContainerProps) {
  const stageInfo = game.stageId != null ? stageUtils.getStageInfo(game.stageId) : undefined;
  const stageImageUrl = stageInfo != null && stageInfo.id !== -1 ? getStageImage(stageInfo.id) : undefined;
  const stageName = stageInfo != null ? stageInfo.name : Messages.unknownStage();

  // Use Set for O(1) lookup instead of O(n) indexOf
  const selected = selectedFilesSet.has(fullPath);

  // Only calculate index if actually selected (for display purposes)
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const selectedIndex = useMemo(
    () => (selected ? selectedFiles.indexOf(fullPath) : -1),
    [selected, selectedFiles, fullPath],
  );

  // Pre-compute drag paths to avoid recreating array
  const dragPaths = useMemo(
    () => (selected && selectedFiles.length > 0 ? selectedFiles : []),
    [selected, selectedFiles],
  );

  const fileDrag = useFileDrag();
  const onShowStats = useCallback(() => onSelect(index), [onSelect, index]);
  const onReplayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onClick(index, e.shiftKey),
    [onClick, index],
  );
  const onPlayClick = useCallback(() => onPlay(index), [onPlay, index]);

  // Drag handler for the entire replay item (drags all selected files)
  const onReplayDragStart = useMemo(() => {
    if (dragPaths.length === 0) {
      return undefined;
    }
    return (event: React.DragEvent<HTMLDivElement>) => {
      fileDrag(event, dragPaths);
    };
  }, [fileDrag, dragPaths]);

  // Drag handler for just the filename (drags only this file)
  const onFileNameDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      fileDrag(event, [fullPath]);
    },
    [fileDrag, fullPath],
  );

  const actions = useMemo((): ReplayFileAction[] => {
    return [
      {
        Icon: MoreHorizIcon,
        label: Messages.moreOptions(),
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onOpenMenu(index, e.currentTarget),
      },
      {
        Icon: EqualizerIcon,
        label: Messages.showStats(),
        onClick: onShowStats,
      },
      {
        Icon: PlayCircleOutlineIcon,
        label: Messages.launchReplay(),
        primary: true,
        onClick: onPlayClick,
        disabled: false,
        isDolphinAction: true,
      },
    ];
  }, [index, onOpenMenu, onPlayClick, onShowStats]);

  const details = useMemo(() => {
    const date = new Date(game.startTime ? Date.parse(game.startTime) : 0);
    return generateReplayDetails({
      gameMode: game.mode,
      date,
      lastFrame: game.lastFrame,
      timerType: game.timerType,
      startingTimerSeconds: game.startingTimerSeconds,
      stageName,
    });
  }, [game.lastFrame, game.mode, game.startTime, game.startingTimerSeconds, game.timerType, stageName]);

  const players = useMemo((): PlayerInfo[][] => {
    const teams = Object.values(groupBy(game.players, (p) => (game.isTeams ? p.teamId : p.port)));
    return teams.map((team) => {
      return team.map((player): PlayerInfo => {
        const backupName = player.type === 1 ? "CPU" : `Player ${player.playerIndex + 1}`;
        const teamId = game.isTeams ? player.teamId : undefined;
        return {
          characterId: player.characterId,
          characterColor: player.characterColor,
          port: player.port,
          teamId,
          variant: player.connectCode ? "code" : "tag",
          text: player.connectCode || player.tag || backupName,
          isWinner: player.isWinner,
        };
      });
    });
  }, [game.isTeams, game.players]);

  return (
    <DraggableFile onDragStart={onReplayDragStart}>
      <div
        key={id}
        css={css`
          cursor: pointer;
        `}
        onClick={onReplayClick}
      >
        <ReplayFileImpl
          fileName={fileName}
          backgroundImage={stageImageUrl}
          selectedIndex={selected ? selectedIndex : undefined}
          players={players}
          actions={actions}
          details={details}
          onFileNameDragStart={onFileNameDragStart}
        />
      </div>
    </DraggableFile>
  );
});

const generateReplayDetails = ({
  date,
  stageName,
  gameMode,
  lastFrame,
  timerType,
  startingTimerSeconds,
}: {
  date: Date;
  stageName: string;
  gameMode?: number;
  lastFrame?: number;
  timerType?: number;
  startingTimerSeconds?: number;
}): ReplayDetail[] => {
  const replayDetails: ReplayDetail[] = [
    {
      Icon: EventIcon,
      label: monthDayHourFormat(new Date(date)) ?? "",
    },
  ];

  if (exists(lastFrame) && gameMode !== GameMode.HOME_RUN_CONTEST) {
    replayDetails.push({
      Icon: TimerIcon,
      label:
        gameMode === GameMode.TARGET_TEST
          ? frameToGameTimer(lastFrame, { timerType, startingTimerSeconds })
          : convertFrameCountToDurationString(lastFrame, "long"),
    });
  }

  replayDetails.push({
    Icon: getReplayStageIcon(gameMode),
    label: stageName,
  });
  return replayDetails;
};

const getReplayStageIcon = (gameMode: number | undefined): React.ComponentType => {
  switch (gameMode) {
    case GameMode.HOME_RUN_CONTEST:
      return SportsCricket;
    case GameMode.TARGET_TEST:
      return TrackChangesIcon;
    default:
      break;
  }
  return LandscapeIcon;
};
