import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import React from "react";

const buttonStyle = { marginLeft: "8px", width: "96px" };
const hiddenIpAddress = "···.···.···.···";
const inputBaseCss = css`
  padding: 4px 8px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.4);
  font-size: 1em;
  margin: 8px 0;
`;

// This is used to correct an observed 1px vertical misalignment
const AlignCenterDiv = styled.div`
  display: flex;
  align-items: center;
`;

const DialogBody = styled.div`
  margin-bottom: 1em;
`;

type CgnatCommandSectionProps = {
  address: string;
};
export const CgnatCommandSection = ({ address }: CgnatCommandSectionProps) => {
  const [cgnatCommandHidden, setCgnatCommandHidden] = React.useState(true);
  const onCgnatCommandShowHide = () => {
    setCgnatCommandHidden(!cgnatCommandHidden);
  };
  const tracerouteCommand = window.electron.common.isWindows ? "tracert" : "traceroute";
  const cgnatCommand = `${tracerouteCommand} ${address}`;
  const displayedCgnatCommand = `${tracerouteCommand} ${cgnatCommandHidden ? hiddenIpAddress : address}`;
  const [cgnatCommandCopied, setCgnatCommandCopied] = React.useState(false);
  const onCgnatCommandCopy = React.useCallback(() => {
    window.electron.clipboard.writeText(cgnatCommand);
    setCgnatCommandCopied(true);
    window.setTimeout(() => setCgnatCommandCopied(false), 2000);
  }, [cgnatCommand]);

  return (
    <div>
      <Typography variant="subtitle2">Run this command</Typography>
      <AlignCenterDiv>
        <InputBase css={inputBaseCss} disabled={true} value={displayedCgnatCommand} />
        <Button variant="contained" color="secondary" onClick={onCgnatCommandShowHide} style={buttonStyle}>
          {cgnatCommandHidden ? "Reveal" : "Hide"}
        </Button>
        <Button variant="contained" color="secondary" onClick={onCgnatCommandCopy} style={buttonStyle}>
          {cgnatCommandCopied ? "Copied!" : "Copy"}
        </Button>
      </AlignCenterDiv>
      <DialogBody>More than one hop to your external IP address indicates CGNAT or Double NAT (or VPN).</DialogBody>
    </div>
  );
};
