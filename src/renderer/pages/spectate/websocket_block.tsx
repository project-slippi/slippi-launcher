import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import React from "react";

import { InfoBlock } from "@/components/info_block";

const StartStopButton = styled(Button)`
  width: 100%;
`;

export const WebSocketBlock = React.memo(
  ({
    startRemoteServer,
    stopRemoteServer,
  }: {
    startRemoteServer: () => Promise<{ port: number }>;
    stopRemoteServer: () => Promise<void>;
  }) => {
    const [port, setPort] = React.useState(0);
    const address = "ws://localhost:" + port;

    const [copied, setCopied] = React.useState(false);
    const onCopy = React.useCallback(() => {
      // Set the clipboard text
      window.electron.clipboard.writeText(address);

      // Set copied indication
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }, [address]);

    const [starting, setStarting] = React.useState(false);
    const onStart = async () => {
      setStarting(true);
      const { port: newPort } = await startRemoteServer();
      setPort(newPort);
      setStarting(false);
    };
    const onStop = async () => {
      await stopRemoteServer();
      setPort(0);
    };

    return (
      <InfoBlock title="WebSocket Server">
        <div style={{ fontSize: 14 }}>
          <p style={{ marginTop: 0 }}>Remote control Slippi spectate via WebSocket.</p>
        </div>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            margin-bottom: 14px;
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
            value={port > 0 ? address : "Stopped"}
          />
          <Button variant="contained" color="secondary" onClick={onCopy} disabled={port === 0}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        {port > 0 ? (
          <StartStopButton variant="outlined" color="secondary" onClick={onStop}>
            Stop
          </StartStopButton>
        ) : (
          <StartStopButton variant="contained" color="primary" onClick={onStart} disabled={starting}>
            {starting ? "Starting..." : "Start"}
          </StartStopButton>
        )}
      </InfoBlock>
    );
  },
);
