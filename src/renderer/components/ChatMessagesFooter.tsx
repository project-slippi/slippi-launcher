import { css } from "@emotion/react";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import React from "react";

export interface ChatMessagesFooterProps {
  loading: boolean;
  dirty: boolean;
  saveToDatabase: () => void;
  discardChanges: () => void;
}

export const ChatMessagesFooter: React.FC<ChatMessagesFooterProps> = ({
  loading,
  dirty,
  saveToDatabase,
  discardChanges,
}) => {
  // const { showError } = useToasts();
  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: auto auto 1fr;
        gap: 16px;
      `}
    >
      <LoadingButton
        css={css`
          min-width: 100px;
        `}
        variant="contained"
        disabled={!dirty || loading}
        loading={loading}
        onClick={saveToDatabase}
      >
        Save
      </LoadingButton>
      <Button
        css={css`
          min-width: 200px;
        `}
        variant="contained"
        disabled={!dirty || loading}
        onClick={discardChanges}
        color="secondary"
      >
        Discard Changes
      </Button>
    </div>
  );
};
