import { css } from "@emotion/react";
import React from "react";

import { colors } from "@/styles/colors";
import { withFont } from "@/styles/with_font";

type LabelledTextProps = {
  className?: string;
  label: string;
};

export const LabelledText = ({ label, children, className }: React.PropsWithChildren<LabelledTextProps>) => {
  return (
    <div
      className={className}
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        css={css`
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
          color: ${colors.purpleLight};
          font-family: ${withFont("Maven Pro")};
        `}
      >
        {label}
      </div>
      <div
        css={css`
          color: white;
        `}
      >
        {children}
      </div>
    </div>
  );
};
