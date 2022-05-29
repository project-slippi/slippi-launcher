import { css } from "@emotion/react";
import styled from "@emotion/styled";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import Button from "@mui/material/Button";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";

export interface FileSelectionToolbarProps {
  totalSelected: number;
  onSelectAll: () => void;
  onPlay: () => void;
  onClear: () => void;
  onDelete: () => void;
}

export const FileSelectionToolbar: React.FC<FileSelectionToolbarProps> = ({
  totalSelected,
  onSelectAll,
  onPlay,
  onClear,
  onDelete,
}) => {
  const [showDeletePrompt, setShowDeletePrompt] = React.useState(false);

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
          <Button
            color="secondary"
            variant="contained"
            size="small"
            onClick={() => setShowDeletePrompt(true)}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Button color="secondary" variant="contained" size="small" onClick={onClear} startIcon={<BlockIcon />}>
            Clear
          </Button>
          <Button
            color="secondary"
            variant="contained"
            size="small"
            onClick={onSelectAll}
            startIcon={<SelectAllIcon />}
          >
            Select All
          </Button>
          <Button color="primary" variant="contained" size="small" onClick={onPlay} startIcon={<PlayArrowIcon />}>
            Play All
          </Button>
        </div>
      </div>
      <ConfirmationModal
        open={showDeletePrompt}
        title="Confirm File Deletion"
        confirmText="Delete"
        onClose={() => setShowDeletePrompt(false)}
        onSubmit={onDelete}
      >
        {totalSelected} file(s) will be deleted.
      </ConfirmationModal>
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
