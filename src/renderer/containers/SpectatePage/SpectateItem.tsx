import { css } from "@emotion/react";
import styled from "@emotion/styled";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { UserIcon } from "@/components/UserIcon";

export const SpectateItem = ({
  broadcasterPicture,
  broadcasterName,
  name,
  onWatch,
}: {
  broadcasterName: string;
  broadcasterPicture: string;
  name: string;
  onWatch: () => void;
}) => {
  return (
    <Outer>
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            margin-right: 10px;
          `}
        >
          <UserIcon imageUrl={broadcasterPicture} size={40} />
        </div>
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
  margin-bottom: 10px;
`;
