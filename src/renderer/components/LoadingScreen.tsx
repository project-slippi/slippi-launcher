import { css } from "@emotion/react";
import LinearProgress from "@mui/material/LinearProgress";
import React from "react";

import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";

import { Message } from "./Message";

export const LoadingScreen: React.FC<{
  className?: string;
  message?: string;
  style?: React.CSSProperties;
}> = ({ message, style, className }) => {
  return (
    <Message className={className} style={style} icon={<BouncingSlippiLogo />}>
      <p
        css={css`
          text-align: center;
          max-width: 650px;
          word-break: break-word;
          line-height: 1.4em;
          padding: 0 50px;
        `}
      >
        {message}
      </p>
    </Message>
  );
};

export function LoadingScreenWithProgress({ current = 0, total = 100 }: { current?: number; total?: number }) {
  return (
    <Message icon={<BouncingSlippiLogo />}>
      <div
        style={{
          color: "white",
          padding: 3,
          borderRadius: 10,
          borderStyle: "solid",
          borderWidth: 2,
          width: 180,
          marginTop: 30,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={(current / total) * 100}
          sx={{
            borderRadius: 10,
            height: 8,
            "& .MuiLinearProgress-bar": { borderRadius: 10, transitionDuration: "50ms" },
          }}
          color="inherit"
        />
      </div>
    </Message>
  );
}
