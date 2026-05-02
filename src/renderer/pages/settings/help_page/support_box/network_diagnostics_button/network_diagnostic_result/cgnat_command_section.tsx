import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import React from "react";

import styles from "./cgnat_command_section.module.css";
import { NetworkDiagnosticsResultMessages as Messages } from "./network_diagnostics_result.messages";

const hiddenIpAddress = "···.···.···.···";

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
      <Typography variant="subtitle2">{Messages.runThisCommand()}</Typography>
      <div className={styles.alignCenterDiv}>
        <InputBase disabled={true} value={displayedCgnatCommand} className={styles.cgnatCmd} />
        <Button variant="contained" color="secondary" onClick={onCgnatCommandShowHide} className={styles.button}>
          {cgnatCommandHidden ? Messages.reveal() : Messages.hide()}
        </Button>
        <Button variant="contained" color="secondary" onClick={onCgnatCommandCopy} className={styles.button}>
          {cgnatCommandCopied ? Messages.copied() : Messages.copy()}
        </Button>
      </div>
      <div className={styles.body}>{Messages.cgnatOrDoubleNatDescription()}</div>
    </div>
  );
};
