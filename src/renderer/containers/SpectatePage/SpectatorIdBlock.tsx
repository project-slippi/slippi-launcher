/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import React from "react";

import { InfoBlock } from "@/components/InfoBlock";

export interface SpectatorIdBlockProps {
  userId: string;
  className?: string;
}

export const SpectatorIdBlock: React.FC<SpectatorIdBlockProps> = ({ userId, className }) => {
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    // Set the clipboard text
    window.electron.clipboard.writeText(userId);

    // Set copied indication
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [userId]);

  return (
    <InfoBlock title="Your Spectator ID" className={className}>
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
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div
        css={css`
          font-size: 14px;
        `}
      >
        <p>1. Give this ID to the person whose gameplay you want to watch.</p>
        <p>2. Once they have started their broadcast, click Refresh.</p>
        <p>3. Once the broadcast appears, click Watch.</p>
      </div>
    </InfoBlock>
  );
};
