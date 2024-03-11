import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import React from "react";

import { InfoBlock } from "@/components/info_block";
import { colors } from "@/styles/colors";

const StartStopButton = styled(Button)`
  width: 100%;
`;

export const WebSocketBlock = React.memo(
  ({
    startRemoteServer,
    stopRemoteServer,
  }: {
    startRemoteServer: (port: number) => Promise<{ success: boolean; err?: string }>;
    stopRemoteServer: () => Promise<void>;
  }) => {
    const [started, setStarted] = React.useState(false);
    const [startError, setStartError] = React.useState("");

    const [portError, setPortError] = React.useState(false);
    const [port, setPort] = React.useState(49809);
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
      const { success, err } = await startRemoteServer(port);
      if (!success && err) {
        setStartError(err);
      } else {
        setStartError("");
        setStarted(true);
      }
      setStarting(false);
    };
    const onStop = async () => {
      await stopRemoteServer();
      setStarted(false);
    };

    return (
      <InfoBlock title="Spectate Remote Control">
        <div style={{ fontSize: 14 }}>
          <p style={{ marginTop: 0 }}>Remote control Slippi spectate via WebSocket.</p>
        </div>
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
          {started ? "Started" : "Stopped"}
        </div>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            margin-bottom: 14px;
          `}
        >
          {started ? (
            <>
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
              <Button variant="contained" color="secondary" onClick={onCopy} disabled={port === 0}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </>
          ) : (
            <TextField
              defaultValue={port}
              error={portError || !!startError}
              helperText={startError || (portError && "Must be a number from 1 to 65535")}
              inputProps={{ maxLength: 5 }}
              label="Port"
              onChange={(event) => {
                const num = parseInt(event.target.value);
                if (!new RegExp(/^[0-9]+$/).test(event.target.value) || num <= 0 || num > 0xffff) {
                  setPortError(true);
                } else {
                  setPortError(false);
                  setPort(num);
                }
              }}
            />
          )}
        </div>
        {started ? (
          <StartStopButton variant="outlined" color="secondary" onClick={onStop}>
            Stop Server
          </StartStopButton>
        ) : (
          <StartStopButton variant="contained" color="primary" onClick={onStart} disabled={portError || starting}>
            {starting ? "Starting Server..." : "Start Server"}
          </StartStopButton>
        )}
      </InfoBlock>
    );
  },
);
