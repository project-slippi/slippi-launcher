import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import React from "react";

import { InfoBlock } from "@/components/info_block";
import { colors } from "@/styles/colors";

import { SpectatorIdBlockMessages as Messages } from "./spectator_id_block.messages";

type SpectatorIdBlockProps = {
  userId: string;
  className?: string;
};

export const SpectatorIdBlock = ({ userId, className }: SpectatorIdBlockProps) => {
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    // Set the clipboard text
    navigator.clipboard
      .writeText(userId)
      .then(() => {
        // Set copied indication
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(console.error);
  }, [userId]);

  return (
    <InfoBlock title={Messages.yourSpectatorId()} className={className}>
      <div
        css={css`
          display: flex;
          flex-direction: row;
        `}
      >
        <InputBase
          css={css`
            flex: 1;
            padding: 5px 10px;
            margin-right: 10px;
            border-radius: 10px;
            background-color: rgba(0, 0, 0, 0.4);
            font-size: 14px;
          `}
          disabled={true}
          value={userId}
        />
        <Button variant="contained" color="secondary" onClick={onCopy}>
          {copied ? Messages.copied() : Messages.copy()}
        </Button>
      </div>
      <div
        css={css`
          font-size: 14px;
          color: ${colors.textDim};
        `}
      >
        <p>{Messages.spectatorInstructions()}</p>
      </div>
    </InfoBlock>
  );
};
