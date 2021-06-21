/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import AddIcon from "@material-ui/icons/Add";

import { ReactComponent as WiiIcon } from "@/styles/images/wii-icon.svg";

export interface NewConnectionItemProps {
  nickname?: string;
  ip: string;
  onAdd: () => void;
}

export const NewConnectionItem: React.FC<NewConnectionItemProps> = ({ ip, onAdd, nickname }) => {
  const title = nickname ? `${ip} (${nickname})` : ip;
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 10px;
        border-radius: 10px;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <WiiIcon fill="#ffffff" width="40px" />
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: 10px;
          `}
        >
          <div>{title}</div>
          <div>Available</div>
        </div>
      </div>
      <div>
        <Tooltip title="Add">
          <IconButton onClick={onAdd} size="small">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};
