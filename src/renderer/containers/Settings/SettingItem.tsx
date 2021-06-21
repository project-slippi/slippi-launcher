/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Typography from "@material-ui/core/Typography";
import React from "react";

export interface SettingItemProps {
  name: string;
  description?: string;
}

export const SettingItem: React.FC<SettingItemProps> = (props) => {
  return (
    <div
      css={css`
        margin: 20px 0;
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
      {props.description && (
        <div
          css={css`
            padding-bottom: 10px;
          `}
        >
          <Typography variant="caption">{props.description}</Typography>
        </div>
      )}
      {props.children}
    </div>
  );
};
