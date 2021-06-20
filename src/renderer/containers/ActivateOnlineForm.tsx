/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import { slippiActivationUrl } from "common/constants";
import { shell } from "electron";
import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";

export interface ActivateOnlineFormProps {
  className?: string;
  hideRetry?: boolean;
}

export const ActivateOnlineForm: React.FC<ActivateOnlineFormProps> = ({ className, hideRetry }) => {
  const isRefreshing = useAccount((store) => store.loading);
  const playKey = useAccount((store) => store.playKey);
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <div className={className}>
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
        {!hideRetry && (
          <Button
            disabled={isRefreshing}
            color="secondary"
            onClick={refreshActivation}
            css={css`
              text-transform: initial;
              margin-top: 10px;
            `}
          >
            {!playKey && isRefreshing ? "Checking activation..." : "I've already activated"}
          </Button>
        )}
      </div>
    </div>
  );
};
