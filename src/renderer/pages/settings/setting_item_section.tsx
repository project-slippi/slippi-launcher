import { css } from "@emotion/react";
import Typography from "@mui/material/Typography";
import React from "react";

type SettingItemProps = {
  name: React.ReactNode | string;
  description?: React.ReactNode | string;
};

export const SettingItem = (props: React.PropsWithChildren<SettingItemProps>) => {
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
