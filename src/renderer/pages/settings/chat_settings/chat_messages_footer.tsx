import { css } from "@emotion/react";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";

import { ChatSettingsMessages as Messages } from "./chat_settings.messages";

type ChatMessagesFooterProps = {
  loading: boolean;
  dirty: boolean;
  saveToDatabase: () => void;
  discardChanges: () => void;
};

export const ChatMessagesFooter = ({ loading, dirty, saveToDatabase, discardChanges }: ChatMessagesFooterProps) => {
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
        {Messages.save()}
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
        {Messages.discardChanges()}
      </Button>
    </div>
  );
};
