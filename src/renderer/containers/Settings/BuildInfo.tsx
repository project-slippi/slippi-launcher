/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import moment from "moment";
import React from "react";

const appVersion = __VERSION__;
const buildDate = moment.utc(__DATE__);
const commitHash = __COMMIT__;

export interface BuildInfoProps {
  className?: string;
}

export const BuildInfo: React.FC<BuildInfoProps> = ({ className }) => {
  return (
    <div
      className={className}
      css={css`
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        padding: 10px;
      `}
    >
      <div>
        Version {appVersion} ({commitHash})
      </div>
      <div>Build {buildDate.format("YYYYMMDD")}</div>
    </div>
  );
};
