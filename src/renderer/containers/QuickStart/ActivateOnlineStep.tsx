/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { slippiActivationUrl } from "common/constants";
import { shell } from "electron";
import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";

import { QuickStartHeader } from "./QuickStartHeader";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const ActivateOnlineStep: React.FC = () => {
  const isRefreshing = useAccount((store) => store.loading);
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Enable Online Play</QuickStartHeader>
        <div>
          Your account needs to be activated for online play. Click the button below and follow the instructions on the
          website to complete activation.
        </div>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: auto;
            margin-right: auto;
            margin-top: 50px;
            max-width: 400px;
          `}
        >
          <Button variant="contained" color="primary" onClick={() => shell.openExternal(slippiActivationUrl)}>
            Activate online play
          </Button>
          <Button
            disabled={isRefreshing}
            color="secondary"
            onClick={refreshActivation}
            css={css`
              text-transform: initial;
              margin-top: 10px;
            `}
          >
            {isRefreshing ? "Checking activation..." : "I've already activated"}
          </Button>
        </div>
      </Container>
    </Box>
  );
};
