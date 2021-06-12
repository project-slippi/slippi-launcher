/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import React from "react";

import { UserIcon } from "@/components/UserIcon";

export interface SpectateItemProps {
  broadcasterName: string;
  broadcasterId: string;
  name: string;
  onWatch: () => void;
}

export const SpectateItem: React.FC<SpectateItemProps> = ({ broadcasterName, broadcasterId, name, onWatch }) => {
  return (
    <Outer>
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <UserIcon
          userId={broadcasterId}
          size="40px"
          css={css`
            margin-right: 10px;
          `}
        />
        <div
          css={css`
            display: flex;
            flex-direction: column;
          `}
        >
          <div>{broadcasterName}</div>
          <div>{name}</div>
        </div>
      </div>
      <Button color="primary" onClick={onWatch} startIcon={<PlayCircleOutlineIcon />}>
        Watch
      </Button>
    </Outer>
  );
};

const Outer = styled(Paper)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
`;
