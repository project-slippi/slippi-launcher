import { exists } from "@common/exists";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { DraggableFile } from "@/components/draggable_file";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { colors } from "@/styles/colors";

import { ReplayFileMessages as Messages } from "./replay_file.messages";
import type { PlayerInfo } from "./team_elements/team_elements";
import { TeamElements } from "./team_elements/team_elements";

export type ReplayDetail = {
  Icon: React.ComponentType;
  label: string;
};

export type ReplayFileAction = {
  Icon: React.ComponentType;
  primary?: boolean;
  disabled?: boolean;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isDolphinAction?: boolean; // Flag to indicate this button needs Dolphin status
};

type ReplayFileProps = {
  fileName: string;
  fullPath: string;
  players: PlayerInfo[][];
  details: ReplayDetail[];
  actions: ReplayFileAction[];
  selectedIndex?: number;
  backgroundImage?: string;
};

export const ReplayFile = React.memo(function ReplayFile({
  selectedIndex,
  backgroundImage,
  actions,
  players,
  fileName,
  fullPath,
  details,
}: ReplayFileProps) {
  const selected = exists(selectedIndex) && selectedIndex >= 0;
  return (
    <Outer backgroundImage={backgroundImage} selected={selected}>
      <div
        css={css`
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          padding: 10px;
          background-color: ${selected ? "rgba(180, 130, 176, 0.1)" : "transparent"};
          width: 100%;
        `}
      >
        {selected && <SelectedNumber num={selectedIndex + 1} />}
        <div
          css={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          `}
        >
          <TeamElements teams={players} />
          <div
            css={css`
              display: flex;
            `}
          >
            {actions.map((action, i) => (
              <ActionButton key={i} action={action} />
            ))}
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
            width: 100%;
          `}
        >
          <div
            css={css`
              display: flex;
              align-items: center;
              flex: 1;
            `}
          >
            {details.map(({ Icon, label }, i) => (
              <InfoItem key={i} Icon={Icon} label={label} />
            ))}
          </div>
          <DraggableFile
            filePaths={[fullPath]}
            css={css`
              min-width: 0;
              opacity: 0.9;
              &:hover {
                opacity: 1;
                text-decoration: underline;
              }
            `}
          >
            <span
              css={css`
                max-width: 350px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {fileName}
            </span>
          </DraggableFile>
        </div>
      </div>
    </Outer>
  );
});

const Outer = styled.div<{
  backgroundImage?: string;
  selected?: boolean;
}>`
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
  will-change: border-color;
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

const InfoItem = React.memo(({ Icon, label }: { Icon: React.ComponentType; label: string }) => {
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
        <Icon />
      </div>
      <div>{label}</div>
    </div>
  );
});

type ReplayActionButtonProps = Omit<React.ComponentProps<typeof IconButton>, "color"> & {
  label: string;
  color?: string;
};

// Wrapper component that handles dynamic Dolphin status for play button
const ActionButton = React.memo(({ action }: { action: ReplayFileAction }) => {
  const { label, onClick, Icon, disabled, primary, isDolphinAction } = action;

  // Only subscribe to Dolphin status if this is a Dolphin action
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);

  const finalLabel = isDolphinAction
    ? playbackStatus === DolphinStatus.READY
      ? label
      : Messages.dolphinIsUpdating()
    : label;

  const finalDisabled = isDolphinAction ? playbackStatus !== DolphinStatus.READY : disabled;

  return (
    <ReplayActionButton
      color={primary ? colors.greenDark : undefined}
      label={finalLabel}
      onClick={onClick}
      disabled={finalDisabled}
    >
      <Icon />
    </ReplayActionButton>
  );
});

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
            onClick?.(e);
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
  // Base font size is 30px, scale down for longer numbers
  const svgFontSize = chars > 2 ? 60 / chars : 30;
  const maskId = `selected-number-mask-${num}`;

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
        z-index: 1;
      `}
    >
      <svg width="50" height="50" viewBox="0 0 50 50">
        <defs>
          <mask id={maskId}>
            <circle cx="25" cy="25" r="25" fill="white" />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={svgFontSize}
              fontWeight="bold"
              fill="black"
            >
              {num}
            </text>
          </mask>
        </defs>
        <circle cx="25" cy="25" r="25" fill="rgba(255, 255, 255, 0.9)" mask={`url(#${maskId})`} />
      </svg>
    </div>
  );
};
