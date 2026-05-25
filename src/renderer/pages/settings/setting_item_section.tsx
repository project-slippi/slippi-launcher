import { css } from "@emotion/react";
import Typography from "@mui/material/Typography";
import React from "react";

type SettingItemProps = {
  name?: React.ReactNode | string;
  description?: React.ReactNode | string;
  children?: React.ReactNode;
};

export const SettingItem = ({ name, description, children }: SettingItemProps) => {
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
        {name && (
          <Typography
            variant="subtitle1"
            css={css`
              text-transform: capitalize;
            `}
          >
            {name}
          </Typography>
        )}
        {description && <Typography variant="caption">{description}</Typography>}
      </div>
      {children}
    </div>
  );
};
