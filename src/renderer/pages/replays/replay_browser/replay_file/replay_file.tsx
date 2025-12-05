import { exists } from "@common/exists";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { colors } from "@/styles/colors";

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
};

type ReplayFileProps = {
  title: React.ReactNode;
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
  title,
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
          <TeamElements teams={players} />
          <div
            css={css`
              display: flex;
            `}
          >
            {actions.map(({ label, onClick, Icon, disabled, primary }, i) => (
              <ReplayActionButton
                key={i}
                color={primary ? colors.greenDark : undefined}
                label={label}
                onClick={onClick}
                disabled={disabled}
              >
                <Icon />
              </ReplayActionButton>
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
          <div>{title}</div>
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

const InfoItem = ({ Icon, label }: { Icon: React.ComponentType; label: string }) => {
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
