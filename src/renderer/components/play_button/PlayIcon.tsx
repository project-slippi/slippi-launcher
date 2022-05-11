import { colors } from "@common/colors";
import { css } from "@emotion/react";
import React from "react";

import { withFont } from "@/styles/withFont";

export const PlayIcon = ({ children, fillPercent = 1 }: React.PropsWithChildren<{ fillPercent?: number }>) => {
  const offset = `${(fillPercent * 100).toFixed(2)}%`;
  return (
    <div
      css={css`
        position: relative;
      `}
    >
      <div
        css={css`
          position: absolute;
          margin-left: 50%;
          transform: translateX(-50%);
          line-height: 45px;
          font-family: ${withFont("Maven Pro")};
          font-weight: bold;
          font-size: 16px;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: 0px -1px #444;
          font-size: 20px;
        `}
      >
        {children}
      </div>
      <svg width="166" height="45" viewBox="0 0 166 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={colors.greenDark} />
            <stop offset={offset} stopColor={colors.greenDark} />
            <stop offset={offset} stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g>
          <path
            d="M143.458 0C143.445 0 143.445 0 143.458 0H18.407L0 32.5853L8.59249 45H143.458V36.0338V35.3181V32.5333C148.937 32.5333 153.388 28.0307 153.388 22.487C153.388 16.9433 148.937 12.4407 143.458 12.4407V8.96616C150.854 8.96616 156.835 15.0304 156.835 22.5C156.835 28.7724 152.616 34.0298 146.905 35.5654V44.7007C157.543 43.022 165.685 33.7305 165.685 22.5C165.698 10.0723 155.729 0 143.458 0ZM147.047 22.5C147.047 24.504 145.439 26.1307 143.458 26.1307V18.8693C145.439 18.8693 147.047 20.496 147.047 22.5Z"
            fill="url(#gradient)"
          />
        </g>
        <path
          d="M143.458 31.5333H142.458V32.5333V35.3181V36.0338V44H9.11652L1.17891 32.5315L18.9906 1H143.448H143.448H143.448H143.449H143.449H143.449H143.449H143.449H143.449H143.449H143.449H143.45H143.45H143.45H143.45H143.45H143.45H143.45H143.451H143.451H143.451H143.451H143.451H143.451H143.451H143.451H143.452H143.452H143.452H143.452H143.452H143.452H143.452H143.453H143.453H143.453H143.453H143.453H143.453H143.454H143.454H143.454H143.454H143.454H143.454H143.454H143.455H143.455H143.455H143.455H143.455H143.455H143.455H143.455H143.456H143.456H143.456H143.456H143.456H143.456H143.456H143.456H143.457H143.457H143.457H143.457H143.457H143.457H143.458H143.458H143.458C155.166 1 164.697 10.6139 164.685 22.499V22.5C164.685 32.8267 157.486 41.4284 147.905 43.4971V36.3102C153.667 34.4188 157.835 28.9572 157.835 22.5C157.835 14.4897 151.418 7.96616 143.458 7.96616H142.458V8.96616V12.4407V13.4407H143.458C148.374 13.4407 152.388 17.4846 152.388 22.487C152.388 27.4894 148.374 31.5333 143.458 31.5333ZM142.458 26.1307V27.1307H143.458C146.002 27.1307 148.047 25.0453 148.047 22.5C148.047 19.9547 146.002 17.8693 143.458 17.8693H142.458V18.8693V26.1307Z"
          stroke="#39D05D"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
