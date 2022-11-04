import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import { stages as stageUtils } from "@slippi/slippi-js";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { DraggableFile } from "@/components/DraggableFile";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { extractPlayerNames } from "@/lib/matchNames";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";
import { getStageImage } from "@/lib/utils";

import type { PlayerInfo } from "./replay_file/team_elements/TeamElements";
import { TeamElements } from "./replay_file/team_elements/TeamElements";

export interface ReplayFileProps extends FileResult {
  index: number;
  style?: React.CSSProperties;
  onSelect: () => void;
  onPlay: () => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  selectedFiles: string[];
  selectedIndex: number;
}

const LaunchReplayButton = React.memo(({ onClick }: { onClick: () => void }) => {
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);
  const label = playbackStatus === DolphinStatus.READY ? "Launch replay" : "Dolphin is updating";

  return (
    <ReplayActionButton
      label={label}
      onClick={onClick}
      color={colors.greenDark}
      disabled={playbackStatus !== DolphinStatus.READY}
    >
      <PlayCircleOutlineIcon />
    </ReplayActionButton>
  );
});

export const ReplayFile: React.FC<ReplayFileProps> = ({
  index,
  onOpenMenu,
  style,
  onSelect,
  onPlay,
  onClick,
  selectedFiles,
  selectedIndex,
  startTime,
  settings,
  name,
  metadata,
  lastFrame,
  fullPath,
}) => {
  const selected = selectedIndex !== -1;
  const date = new Date(startTime ? Date.parse(startTime) : 0);
  const stageInfo = settings.stageId !== null ? stageUtils.getStageInfo(settings.stageId) : null;
  const stageImageUrl = stageInfo !== null && stageInfo.id !== -1 ? getStageImage(stageInfo.id) : undefined;
  const stageName = stageInfo !== null ? stageInfo.name : "Unknown Stage";

  const teams: PlayerInfo[][] = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value()
    .map((team) => {
      return team.map((player): PlayerInfo => {
        const backupName = player.type === 1 ? "CPU" : `Player ${player.playerIndex + 1}`;
        const names = extractPlayerNames(player.playerIndex, settings, metadata);
        const teamId = settings.isTeams ? player.teamId : undefined;
        return {
          characterId: player.characterId,
          characterColor: player.characterColor,
          port: player.port,
          teamId: teamId ?? undefined,
          variant: names.code ? "code" : "tag",
          text: names.code ?? (names.tag || backupName),
        };
      });
    });

  return (
    <DraggableFile filePaths={selected && selectedFiles.length > 0 ? selectedFiles : []}>
      <div onClick={onClick} style={style}>
        <Outer backgroundImage={stageImageUrl ?? undefined} selected={selected}>
          <div
            css={css`
              display: flex;
              flex: 1;
              flex-direction: column;
              justify-content: center;
              padding: 10px;
              background-color: ${selected ? "rgba(180, 130, 176, 0.1)" : "transparent"};
            `}
          >
            {selected && <SelectedNumber num={selectedIndex + 1} />}
            <div
              css={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
              `}
            >
              <TeamElements teams={teams} />
              <div
                css={css`
                  display: flex;
                `}
              >
                <ReplayActionButton label="More options" onClick={(e) => onOpenMenu(index, e.currentTarget as any)}>
                  <MoreHorizIcon />
                </ReplayActionButton>
                <ReplayActionButton label="Show stats" onClick={onSelect}>
                  <EqualizerIcon />
                </ReplayActionButton>
                <LaunchReplayButton onClick={onPlay} />
              </div>
            </div>

            <div
              css={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 5px;
                font-size: 14px;
                white-space: nowrap;
              `}
            >
              <div
                css={css`
                  display: flex;
                  align-items: center;
                  flex: 1;
                `}
              >
                <InfoItem label={<EventIcon />}>{monthDayHourFormat(moment(date))}</InfoItem>

                {lastFrame !== null && (
                  <InfoItem label={<TimerOutlinedIcon />}>
                    {convertFrameCountToDurationString(lastFrame, "m[m] ss[s]")}
                  </InfoItem>
                )}
                <InfoItem label={<LandscapeIcon />}>{stageName}</InfoItem>
              </div>
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
                {name}
              </DraggableFile>
            </div>
          </div>
        </Outer>
      </div>
    </DraggableFile>
  );
};

const Outer = styled.div<{
  backgroundImage?: string;
  selected?: boolean;
}>`
  cursor: pointer;
  display: flex;
  position: relative;
  border-style: solid;
  border-width: 1px;
  border-color: ${(p) => (p.selected ? "rgba(255, 255, 255, 0.7)" : "rgba(159, 116, 192, 0.1)")};
  overflow: hidden;
  border-radius: 10px;
  height: 80px;
  margin: 10px;
  background: ${(p) =>
    p.backgroundImage
      ? `linear-gradient(to right, ${colors.purpleDark} 20%, transparent 35%, transparent 65%, ${colors.purpleDark} 80%)`
      : colors.purpleDark};
  &::before {
    z-index: -1;
    position: absolute;
    content: "";
    height: 100%;
    width: 100%;
    ${(p) => (p.backgroundImage ? `background-image: url("${p.backgroundImage}");` : "")}
    background-repeat: no-repeat;
    background-position: center;
    background-size: 60%;
    opacity: 0.25;
  }
`;

const InfoItem: React.FC<{
  label?: React.ReactNode;
}> = ({ label, children }) => {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        margin-right: 20px;
      `}
    >
      <div
        css={css`
          display: flex;
          margin-right: 5px;
          opacity: 0.6;
          svg {
            font-size: 16px;
          }
        `}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
};

type ReplayActionButtonProps = Omit<React.ComponentProps<typeof IconButton>, "color"> & {
  label: string;
  color?: string;
};

const ReplayActionButton = React.memo(({ label, color, onClick, ...rest }: ReplayActionButtonProps) => {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          css={css`
            padding: 5px;
            margin: 0 5px;
            color: ${color ?? colors.purplePrimary};
          `}
          size="large"
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick(e);
          }}
          {...rest}
        />
      </span>
    </Tooltip>
  );
});

const SelectedNumber = ({ num }: { num: number }) => {
  // Scale the font size based on the length of the number string
  const chars = num.toString().length;
  const fontSize = chars > 2 ? `${2 / chars}em` : "1em";
  return (
    <div
      css={css`
        position: absolute;
        width: 50px;
        height: 50px;
        margin-left: auto;
        margin-right: auto;
        left: 0;
        right: 0;
        background-color: rgba(255, 255, 255, 0.9);
        color: black;
        mix-blend-mode: color-dodge;
        font-weight: bold;
        font-size: 30px;
        border-radius: 50%;
        text-align: center;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      `}
    >
      <span style={{ fontSize, lineHeight: fontSize }}>{num}</span>
    </div>
  );
};
