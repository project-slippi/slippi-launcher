import { css } from "@emotion/react";
import ButtonBase from "@mui/material/ButtonBase";
import React from "react";

import { PlayIcon } from "./PlayIcon";

type MainButtonProps = React.ComponentProps<typeof ButtonBase> & {
  fillPercent?: number;
};

const MainButton = React.memo((props: MainButtonProps) => {
  const { children, fillPercent, ...rest } = props;
  return (
    <ButtonBase
      {...rest}
      css={css`
        transition: opacity 0.2s ease-in-out;
        &:disabled {
          opacity: 0.5;
        }
        &:hover {
          opacity: 0.8;
        }
      `}
    >
      <PlayIcon fillPercent={fillPercent}>{children}</PlayIcon>
    </ButtonBase>
  );
});

type PlayButtonProps = Omit<MainButtonProps, "children" | "fillPercent">;

export const PlayButton = React.memo((props: PlayButtonProps) => {
  return <MainButton {...props}>Play</MainButton>;
});

type UpdatingButtonProps = Omit<MainButtonProps, "children">;

export const UpdatingButton = React.memo((props: UpdatingButtonProps) => {
  return (
    <MainButton disabled={true} {...props}>
      <span
        css={css`
          font-size: 0.9em;
        `}
      >
        Updating
      </span>
    </MainButton>
  );
});
