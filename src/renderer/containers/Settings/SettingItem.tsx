import { css } from "@emotion/react";
import Typography from "@mui/material/Typography";
import React from "react";

export interface SettingItemProps {
  name: React.ReactNode | string;
  description?: React.ReactNode | string;
}

export const SettingItem: React.FC<SettingItemProps> = (props) => {
  return (
    <div
      css={css`
        margin: 20px 0;
      `}
    >
      <div
        css={css`
          padding-bottom: 10px;
        `}
      >
        <Typography
          variant="subtitle1"
          css={css`
            text-transform: capitalize;
          `}
        >
          {props.name}
        </Typography>
        {props.description && <Typography variant="caption">{props.description}</Typography>}
      </div>
      {props.children}
    </div>
  );
};
