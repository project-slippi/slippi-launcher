/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import { ipcRenderer } from "electron";
import moment from "moment";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { useAdvancedUser } from "@/lib/useAdvancedUser";

const osInfo = ipcRenderer.sendSync("getOsInfoSync") as string;

const appVersion = __VERSION__;
const buildDate = moment.utc(__DATE__);
const commitHash = __COMMIT__;

export interface BuildInfoProps {
  enableAdvancedUserClick?: boolean;
  className?: string;
}

const DEV_THRESHOLD = 7;

export const BuildInfo: React.FC<BuildInfoProps> = ({ className, enableAdvancedUserClick }) => {
  const [clickCount, setClickCount] = React.useState(0);
  const isAdvancedUser = useAdvancedUser((store) => store.isAdvancedUser);
  const setIsAdvancedUser = useAdvancedUser((store) => store.setIsAdvancedUser);
  const { addToast } = useToasts();
  const handleBuildNumberClick = () => {
    if (!enableAdvancedUserClick) {
      return;
    }

    setClickCount(clickCount + 1);
    if (clickCount < DEV_THRESHOLD - 1) {
      // We haven't clicked enough yet
      return;
    }

    if (!isAdvancedUser) {
      addToast("I hope you know what you're doing...", { appearance: "info", autoDismiss: true });
    }

    setIsAdvancedUser(!isAdvancedUser);
    setClickCount(0);
  };

  return (
    <div
      className={className}
      css={css`
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        padding: 10px;
        line-height: 15px;
      `}
    >
      <div>
        Version {appVersion} ({commitHash})
      </div>
      <div onClick={handleBuildNumberClick}>
        Build
        <span
          css={css`
            text-decoration: ${enableAdvancedUserClick && isAdvancedUser ? "underline" : "initial"};
            margin-left: 4px;
          `}
        >
          {buildDate.format("YYYYMMDD")}
        </span>
      </div>
      <div>{osInfo}</div>
    </div>
  );
};
