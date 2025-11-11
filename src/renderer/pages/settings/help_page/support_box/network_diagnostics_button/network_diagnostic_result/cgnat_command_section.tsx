import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { NetworkDiagnosticsResultMessages as Messages } from "./network_diagnostics_result.messages";
0;
const hiddenIpAddress = "···.···.···.···";

const styles = stylex.create({
  button: {
    marginLeft: "8px",
    width: "96px",
  },
  cgnatCmd: {
    padding: "4px 8px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    fontSize: "1em",
    margin: "8px 0",
  },
  body: {
    marginBottom: "1em",
  },
  alignCenterDiv: {
    display: "flex",
    alignItems: "center",
  },
});

type CgnatCommandSectionProps = {
  address: string;
};
export const CgnatCommandSection = ({ address }: CgnatCommandSectionProps) => {
  const [cgnatCommandHidden, setCgnatCommandHidden] = React.useState(true);
  const onCgnatCommandShowHide = () => {
    setCgnatCommandHidden(!cgnatCommandHidden);
  };
  const tracerouteCommand = window.electron.bootstrap.isWindows ? "tracert" : "traceroute";
  const cgnatCommand = `${tracerouteCommand} ${address}`;
  const displayedCgnatCommand = `${tracerouteCommand} ${cgnatCommandHidden ? hiddenIpAddress : address}`;
  const [cgnatCommandCopied, setCgnatCommandCopied] = React.useState(false);
  const onCgnatCommandCopy = React.useCallback(() => {
    navigator.clipboard
      .writeText(cgnatCommand)
      .then(() => {
        setCgnatCommandCopied(true);
        window.setTimeout(() => setCgnatCommandCopied(false), 2000);
      })
      .catch(console.error);
  }, [cgnatCommand]);

  return (
    <div>
      <Typography variant="subtitle2">Run this command</Typography>
      <div {...stylex.props(styles.alignCenterDiv)}>
        <InputBase disabled={true} value={displayedCgnatCommand} {...stylex.props(styles.cgnatCmd)} />
        <Button variant="contained" color="secondary" onClick={onCgnatCommandShowHide} {...stylex.props(styles.button)}>
          {cgnatCommandHidden ? Messages.reveal() : Messages.hide()}
        </Button>
        <Button variant="contained" color="secondary" onClick={onCgnatCommandCopy} {...stylex.props(styles.button)}>
          {cgnatCommandCopied ? Messages.copied() : Messages.copy()}
        </Button>
      </div>
      <div {...stylex.props(styles.body)}>{Messages.cgnatOrDoubleNatDescription()}</div>
    </div>
  );
};
