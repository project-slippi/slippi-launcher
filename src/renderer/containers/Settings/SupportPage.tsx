/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { ipc_copyLogsToClipboard } from "common/ipc";
import React from "react";

import { SettingItem } from "./SettingItem";

export const SupportPage: React.FC = () => {
  const [isCopying, setCopying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    // Set the clipboard text
    setCopying(true);
    const res = await ipc_copyLogsToClipboard.renderer!.trigger({});
    setCopying(false);

    // Set copied indication
    if (res.result) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div>
      <h1>Help</h1>
      <SettingItem name={`Share Logs`}>
        <Button disabled={isCopying || copied} variant="contained" color="primary" onClick={onCopy}>
          {copied ? "Copied!" : "Copy Logs"}{" "}
          {isCopying && (
            <CircularProgress
              css={css`
                margin-left: 10px;
              `}
              size={16}
              thickness={6}
              color="inherit"
            />
          )}
        </Button>
      </SettingItem>
    </div>
  );
};
