/** @jsx jsx */
import { css, jsx } from "@emotion/react";
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
