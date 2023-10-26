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
import { groupBy } from "lodash";
import moment from "moment";
import React, { useCallback, useMemo } from "react";

import { DraggableFile } from "@/components/DraggableFile";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";
import { getStageImage } from "@/lib/utils";

import type { ReplayDetail } from "./ReplayFile";
import { ReplayFile as ReplayFileImpl } from "./ReplayFile";
import type { PlayerInfo } from "./team_elements/TeamElements";

type ReplayFileContainerProps = FileResult & {
  index: number;
  style?: React.CSSProperties;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onClick: (index: number, isShiftHeld: boolean) => void;
  selectedFiles: string[];
  selectedIndex: number;
};

export const ReplayFileContainer = React.memo(function ReplayFileContainer({
  index,
  onOpenMenu,
  style,
  onSelect,
  onPlay,
  onClick,
  selectedFiles,
  selectedIndex,
  id,
  fileName,
  game,
  fullPath,
}: ReplayFileContainerProps) {
  const selected = selectedIndex !== -1;
  const stageInfo = game.stageId != null ? stageUtils.getStageInfo(game.stageId) : null;
  const stageImageUrl = stageInfo !== null && stageInfo.id !== -1 ? getStageImage(stageInfo.id) : undefined;
  const stageName = stageInfo !== null ? stageInfo.name : "Unknown Stage";
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);

  const onShowStats = useCallback(() => onSelect(index), [onSelect, index]);
  const onReplayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onClick(index, e.shiftKey),
    [onClick, index],
  );
  const onPlayClick = useCallback(() => onPlay(index), [onPlay, index]);

  const actions = useMemo(() => {
    return [
      {
        Icon: MoreHorizIcon,
        label: "More options",
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onOpenMenu(index, e.currentTarget),
      },
      {
        Icon: EqualizerIcon,
        label: "Show stats",
        onClick: onShowStats,
      },
      {
        Icon: PlayCircleOutlineIcon,
        label: playbackStatus === DolphinStatus.READY ? "Launch replay" : "Dolphin is updating",
        primary: true,
        onClick: onPlayClick,
        disabled: playbackStatus !== DolphinStatus.READY,
      },
    ];
  }, [index, onOpenMenu, onPlayClick, onShowStats, playbackStatus]);

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
          characterId: player.characterId ?? undefined,
          characterColor: player.characterColor ?? undefined,
          port: player.port,
          teamId: teamId ?? undefined,
          variant: player.connectCode ? "code" : "tag",
          text: player.connectCode || player.tag || backupName,
          isWinner: player.isWinner,
        };
      });
    });
  }, [game.isTeams, game.players]);

  const title = useMemo(() => {
    return (
      <DraggableFile
        filePaths={[fullPath]}
        css={css`
          opacity: 0.9;
          &:hover {
            opacity: 1;
            text-decoration: underline;
          }
        `}
      >
        {fileName}
      </DraggableFile>
    );
  }, [fileName, fullPath]);

  return (
    <DraggableFile filePaths={selected && selectedFiles.length > 0 ? selectedFiles : []}>
      <div
        key={id}
        css={css`
          cursor: pointer;
        `}
        onClick={onReplayClick}
        style={style}
      >
        <ReplayFileImpl
          title={title}
          backgroundImage={stageImageUrl}
          selectedIndex={selected ? selectedIndex : undefined}
          players={players}
          actions={actions}
          details={details}
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
  timerType = null,
  startingTimerSeconds = null,
}: {
  date: Date;
  stageName: string;
  gameMode: number | null;
  lastFrame: number | null;
  timerType: number | null;
  startingTimerSeconds?: number | null;
}): ReplayDetail[] => {
  const replayDetails: ReplayDetail[] = [
    {
      Icon: EventIcon,
      label: monthDayHourFormat(moment(date)) ?? "",
    },
  ];

  if (exists(lastFrame) && gameMode !== GameMode.HOME_RUN_CONTEST) {
    replayDetails.push({
      Icon: TimerIcon,
      label:
        gameMode === GameMode.TARGET_TEST
          ? frameToGameTimer(lastFrame, { timerType, startingTimerSeconds })
          : convertFrameCountToDurationString(lastFrame, "m[m] ss[s]"),
    });
  }

  replayDetails.push({
    Icon: getReplayStageIcon(gameMode),
    label: stageName,
  });
  return replayDetails;
};

const getReplayStageIcon = (gameMode: number | null): React.ComponentType => {
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
