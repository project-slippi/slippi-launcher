/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import FolderIcon from "@material-ui/icons/Folder";
import { colors } from "common/colors";
import { remote, shell } from "electron";
import React from "react";

import { BasicFooter } from "@/components/BasicFooter";
import { useSpectateSlpPath } from "@/lib/hooks/useSettings";
import { withFont } from "@/styles/withFont";

export const Footer: React.FC = () => {
  const [spectateSlpFolder, setSpectateSlpFolder] = useSpectateSlpPath();
  const onClick = async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    setSpectateSlpFolder(res[0]);
  };
  return (
    <BasicFooter>
      <Tooltip title="Reveal location">
        <IconButton
          size="small"
          onClick={() => shell.openItem(spectateSlpFolder)}
          css={css`
            color: ${colors.purpleLight};
          `}
        >
          <FolderIcon />
        </IconButton>
      </Tooltip>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          margin-left: 10px;
          margin-right: 15px;
          padding-right: 20px;
          border-right: solid 1px ${colors.purple};
        `}
      >
        <div
          css={css`
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-family: ${withFont("Maven Pro")};
          `}
        >
          Save spectated games to
        </div>
        <div
          css={css`
            color: white;
            font-weight: lighter;
          `}
        >
          {spectateSlpFolder}
        </div>
      </div>
      <Button
        size="small"
        css={css`
          color: ${colors.purpleLight};
          text-transform: initial;
        `}
        onClick={onClick}
      >
        Change Folder
      </Button>
    </BasicFooter>
  );
};
