import { css } from "@emotion/react";
import FolderIcon from "@mui/icons-material/Folder";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { BasicFooter } from "@/components/footer/footer";
import { LabelledText } from "@/components/labelled_text";
import { useSpectateSlpPath } from "@/lib/hooks/use_settings";
import { colors } from "@/styles/colors";

import { FooterMessages as Messages } from "./footer.messages";

export const Footer = React.memo(() => {
  const [spectateSlpFolder, setSpectateSlpFolder] = useSpectateSlpPath();
  const onClick = async () => {
    const result = await window.electron.common.showOpenDialog({
      properties: ["openDirectory"],
    });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    await setSpectateSlpFolder(res[0]);
  };
  return (
    <BasicFooter>
      <Tooltip title={Messages.revealLocation()}>
        <IconButton
          size="small"
          onClick={() => window.electron.shell.openPath(spectateSlpFolder)}
          css={css`
            color: ${colors.purpleLight};
          `}
        >
          <FolderIcon />
        </IconButton>
      </Tooltip>
      <LabelledText
        css={css`
          margin-left: 10px;
          margin-right: 15px;
          padding-right: 20px;
          border-right: solid 1px ${colors.purple};
        `}
        label={Messages.saveSpectatedGamesTo()}
      >
        {spectateSlpFolder}
      </LabelledText>
      <Button
        size="small"
        css={css`
          color: ${colors.purpleLight};
          text-transform: initial;
        `}
        onClick={onClick}
      >
        {Messages.changeFolder()}
      </Button>
    </BasicFooter>
  );
});
