import { css } from "@emotion/react";
import styled from "@emotion/styled";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import IconButton from "@mui/material/IconButton";
import React from "react";

const Outer = styled.div`
  display: flex;
  align-items: left;
  justify-content: space-between;
  padding: 20px 10px;
`;

export interface PlayerDashboardProps {
  onSelectGlobal: () => void;
  disabled?: boolean;
}

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

export const PlayerDashboard = React.forwardRef<HTMLInputElement, PlayerDashboardProps>((props, _) => {
  return (
    <Outer>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 00px;
          padding: 20px;
          font-size: 30px;
        `}
      >
        <div>eastballz (RANK ICON)</div>
        <div>EAST#312)</div>
      </div>
      <div
        css={css`
          display: flex;
          flex: 1;
          font-size: 14px;
          flex-direction: column;
          align-items: center;
          margin-top: 30px;
        `}
      >
        <div
          css={css`
            display: flex;
            font-size: 14px;
          `}
        >
          <InfoItem label={<EventIcon />}>1,234 games</InfoItem>
          <InfoItem label={<LandscapeIcon />}>720 won</InfoItem>
          <InfoItem label={<LandscapeIcon />}>514 lost</InfoItem>
        </div>
        <div
          css={css`
            display: flex;
            font-size: 14px;
            padding: 10px;
          `}
        >
          <InfoItem label={<EventIcon />}>34h played</InfoItem>
          <InfoItem label={<LandscapeIcon />}>3,523 kills</InfoItem>
          <InfoItem label={<LandscapeIcon />}>3,123 deaths</InfoItem>
          <IconButton
            css={css`
              display: inline-flex;
              vertical-align: top;
            `}
            onClick={(e) => {
              e.stopPropagation();
              // onClick && onClick(e);
            }}
          >
            <EqualizerIcon onClick={() => props.onSelectGlobal()} />
          </IconButton>
        </div>
      </div>
    </Outer>
  );
});
