import type { NatType, PortMapping, Presence } from "@common/types";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { Button as ActionButton } from "@/components/form/button";
import { colors } from "@/styles/colors";

import { NetworkDiagnosticsMessages as Messages } from "./network_diagnostics_button.messages";
import { NetworkDiagnosticsResult } from "./network_diagnostics_result";

type NetworkInformation = {
  address: string;
  cgnat: Presence;
  natType: NatType;
  portMapping: PortMapping;
};

const styles = stylex.create({
  container: {
    textAlign: "center",
  },
  text: {
    marginTop: 20,
  },
  icon: {
    height: 18,
    width: 18,
  },
});

export const NetworkDiagnosticsButton = React.memo(() => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [networkInfo, setNetworkInfo] = React.useState<NetworkInformation | undefined>(undefined);

  const runNetworkDiagnostics = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setNetworkInfo(undefined);
    await window.electron.common
      .runNetworkDiagnostics()
      .then(setNetworkInfo)
      .finally(() => setIsLoading(false));
  }, []);

  const openDialog = React.useCallback(async () => {
    setDialogOpen(true);
    await runNetworkDiagnostics();
  }, [runNetworkDiagnostics]);

  const onClose = React.useCallback(() => setDialogOpen(false), []);

  const networkDiagnosticsContent = React.useMemo(() => {
    if (isLoading) {
      return (
        <div {...stylex.props(styles.container)}>
          <CircularProgress color="inherit" />
          <div {...stylex.props(styles.text)}>{Messages.runningDiagnostics()}</div>
        </div>
      );
    }

    if (isError || !networkInfo) {
      return <div>{Messages.errorRunningDiagnostics()}</div>;
    }

    const { address, cgnat, natType, portMapping } = networkInfo;
    return <NetworkDiagnosticsResult ipAddress={address} cgnat={cgnat} natType={natType} portMapping={portMapping} />;
  }, [isError, isLoading, networkInfo]);

  return (
    <div>
      <ActionButton
        startIcon={<NetworkCheckIcon fill={colors.purpleLighter} {...stylex.props(styles.icon)} />}
        color="secondary"
        variant="contained"
        onClick={openDialog}
      >
        {Messages.checkNetworkIssues()}
      </ActionButton>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={onClose} fullWidth={true}>
        <DialogTitle>{Messages.networkDiagnostics()}</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} marginBottom={1}>
            {Messages.turnVpnOff()}
          </Typography>
          <div>{networkDiagnosticsContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
