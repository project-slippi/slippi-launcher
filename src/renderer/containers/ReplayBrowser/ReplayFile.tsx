/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import EqualizerIcon from "@material-ui/icons/Equalizer";
import EventIcon from "@material-ui/icons/Event";
import LandscapeIcon from "@material-ui/icons/Landscape";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import TimerIcon from "@material-ui/icons/Timer";
import { FileResult } from "@replays/types";
import { stages as stageUtils } from "@slippi/slippi-js";
import { colors } from "common/colors";
import { convertFrameCountToDurationString, monthDayHourFormat } from "common/time";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { DraggableFile } from "@/components/DraggableFile";
import { getStageImage } from "@/lib/utils";

import { TeamElements } from "./TeamElements";

export interface ReplayFileProps extends FileResult {
  index: number;
  style?: React.CSSProperties;
  onSelect: () => void;
  onPlay: () => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  handleAddToList: (name: string) => void;
  list: Array<string>;
}

export const ReplayFile: React.FC<ReplayFileProps> = ({
  index,
  onOpenMenu,
  style,
  onSelect,
  onPlay,
  handleAddToList,
  list,
  startTime,
  settings,
  name,
  metadata,
  lastFrame,
  fullPath,
}) => {
  const date = new Date(startTime ? Date.parse(startTime) : 0);
  let stageName = "Unknown";
  try {
    if (settings.stageId !== null) {
      stageName = stageUtils.getStageName(settings.stageId);
    }
  } catch (err) {
    console.error(err);
  }
  const stageImageUrl = settings.stageId !== null ? getStageImage(settings.stageId) : undefined;

  return (
    <div onClick={() => handleAddToList(name)} style={style}>
      <Outer backgroundImage={stageImageUrl ?? undefined}>
        <div
          style={
            list.includes(name)
              ? {
                  backgroundColor: "rgb(180, 130, 176, 10%)",
                }
              : {}
          }
          css={css`
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            padding: 10px;
            position: relative;
          `}
        >
          {list.includes(name) ? (
            <div
              css={css`
                position: absolute;
                left: 0px;
                top: 0px;
                margin-top: -16px;
                margin-left: 2px;
              `}
            >
              <p>#{list.indexOf(name) + 1}</p>
            </div>
          ) : null}

          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <TeamElements settings={settings} metadata={metadata} />
            <div
              css={css`
                display: flex;
              `}
            >
              <ReplayActionButton
                label="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMenu(index, e.currentTarget as any);
                }}
              >
                <MoreHorizIcon />
              </ReplayActionButton>
              <ReplayActionButton
                label="Show stats"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <EqualizerIcon />
              </ReplayActionButton>
              <ReplayActionButton
                label="Launch replay"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
                color={colors.greenDark}
              >
                <PlayCircleOutlineIcon />
              </ReplayActionButton>
            </div>
          </div>

          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 5px;
              font-size: 14px;
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
                <InfoItem label={<TimerIcon />}>{convertFrameCountToDurationString(lastFrame, "m[m] ss[s]")}</InfoItem>
              )}
              <InfoItem label={<LandscapeIcon />}>{stageName}</InfoItem>
            </div>
            <DraggableFile
              fullPath={fullPath}
              css={css`
                opacity: 0.6;
                transition: opacity 0.2s ease-in-out;
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
  );
};

const Outer = styled.div<{
  backgroundImage?: string;
}>`
  display: flex;
  position: relative;
  border: solid 1px rgba(159, 116, 192, 0.1);
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

const ReplayActionButton: React.FC<{
  label: string;
  color?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}> = ({ label, children, onClick, color }) => {
  return (
    <Tooltip title={label}>
      <IconButton
        onClick={onClick}
        css={css`
          padding: 5px;
          margin: 0 5px;
          color: ${color ?? colors.purplePrimary};
        `}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
};
