import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import React from "react";

import { InfoBlock } from "@/components/info_block";
import { colors } from "@/styles/colors";

const StartStopButton = styled(Button)`
  width: 100%;
`;

type SpectateRemoteControlBlockProps = {
  serverStatus: "started" | "starting" | "stopped";
  connected: boolean;
  port: number;
  errorMessage?: string;
  onStart: () => void;
  onStop: () => void;
};

export const SpectateRemoteControlBlock = React.memo(
  ({ serverStatus, connected, port, errorMessage, onStart, onStop }: SpectateRemoteControlBlockProps) => {
    const [copied, setCopied] = React.useState(false);

    const address = "ws://127.0.0.1:" + port;
    const onCopy = React.useCallback(() => {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        })
        .catch(console.error);
    }, [address]);

    let status = "";
    if (connected && serverStatus === "started") {
      status = "Connected";
    } else if (serverStatus === "started") {
      status = "Started";
    } else if (serverStatus === "starting") {
      status = "Starting...";
    } else {
      status = "Stopped";
    }

    return (
      <InfoBlock title="Remote Control Server">
        <div
          css={css`
            background-color: rgba(0, 0, 0, 0.4);
            padding: 5px 10px;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
          `}
        >
          <span
            css={css`
              text-transform: uppercase;
              font-weight: bold;
              color: ${colors.purpleLight};
              margin-right: 10px;
            `}
          >
            Status
          </span>
          {status}
        </div>
        {serverStatus === "started" ? (
          <StartStopButton variant="outlined" color="secondary" onClick={onStop}>
            Stop Server
          </StartStopButton>
        ) : (
          <StartStopButton variant="contained" color="primary" onClick={onStart} disabled={serverStatus === "starting"}>
            {serverStatus === "starting" ? "Starting Server..." : "Start Server"}
          </StartStopButton>
        )}
        {!errorMessage && serverStatus === "started" && (
          <div
            css={css`
              display: flex;
              flex-direction: row;
              margin-top: 14px;
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
              value={address}
            />
            <Button variant="contained" color="secondary" onClick={onCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        )}
        {errorMessage && (
          <div
            css={css`
              color: red;
              font-size: 14px;
              margin-top: 14px;
            `}
          >
            {errorMessage}
          </div>
        )}
      </InfoBlock>
    );
  },
);
