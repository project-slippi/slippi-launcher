/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import React from "react";

export interface FileSelectionToolbarProps {
  totalSelected: number;
  onPlay: () => void;
  onClear: () => void;
  onDelete: () => void;
}

export const FileSelectionToolbar: React.FC<FileSelectionToolbarProps> = ({
  totalSelected,
  onPlay,
  onClear,
  onDelete,
}) => {
  if (totalSelected === 0) {
    return null;
  }

  return (
    <Outer>
      <div
        css={css`
          display: flex;
          flex: 1;
          align-items: flex-end;
          justify-content: space-between;
          padding: 10px;
          button {
            margin-left: 10px;
          }
        `}
      >
        <div
          css={css`
            margin-left: 10px;
          `}
        >
          {totalSelected} files selected
        </div>
        <div>
          <Button color="secondary" variant="contained" size="small" onClick={onPlay}>
            Play All
          </Button>
          <Button color="secondary" variant="contained" size="small" onClick={onClear}>
            Clear
          </Button>
          <Button color="secondary" variant="contained" size="small" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Outer>
  );
};

const Outer = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0));
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;
