import { css } from "@emotion/react";
import styled from "@emotion/styled";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import Button from "@mui/material/Button";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";

import { FileSelectionToolbarMessages as Messages } from "./file_selection_toolbar.messages";

type FileSelectionToolbarProps = {
  totalSelected: number;
  isSelectAllMode?: boolean;
  onSelectAll: () => void;
  onPlay: () => void;
  onClear: () => void;
  onDelete: () => void;
};

export const FileSelectionToolbar = ({
  totalSelected,
  isSelectAllMode = false,
  onSelectAll,
  onPlay,
  onClear,
  onDelete,
}: FileSelectionToolbarProps) => {
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
          {isSelectAllMode ? Messages.allFilesSelected(totalSelected) : Messages.filesSelected(totalSelected)}
        </div>
        <div>
          <Button
            color="secondary"
            variant="contained"
            size="small"
            onClick={() => setShowDeletePrompt(true)}
            startIcon={<DeleteIcon />}
          >
            {Messages.delete()}
          </Button>
          <Button color="secondary" variant="contained" size="small" onClick={onClear} startIcon={<BlockIcon />}>
            {Messages.clear()}
          </Button>
          <Button
            color="secondary"
            variant="contained"
            size="small"
            onClick={onSelectAll}
            startIcon={<SelectAllIcon />}
          >
            {Messages.selectAll()}
          </Button>
          <Button color="primary" variant="contained" size="small" onClick={onPlay} startIcon={<PlayArrowIcon />}>
            {Messages.playAll()}
          </Button>
        </div>
      </div>
      <ConfirmationModal
        open={showDeletePrompt}
        title={Messages.confirmFileDeletion()}
        confirmText={Messages.delete()}
        onClose={() => setShowDeletePrompt(false)}
        onSubmit={onDelete}
      >
        {Messages.willBeDeleted(totalSelected)}
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
