import { colors } from "@common/colors";
import type { NatType, PortMapping, Presence } from "@common/types";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";

import { Button as ActionButton } from "@/components/form/button";

import { NetworkDiagnosticsResult } from "./network_diagnostics_result";

type NetworkInformation = {
  address: string;
  cgnat: Presence;
  natType: NatType;
  portMapping: PortMapping;
};

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
        <div style={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <div style={{ marginTop: 20 }}>Running network diagnostics...</div>
        </div>
      );
    }

    if (isError || !networkInfo) {
      return <div>Error running network diagnostics</div>;
    }

    const { address, cgnat, natType, portMapping } = networkInfo;
    return <NetworkDiagnosticsResult ipAddress={address} cgnat={cgnat} natType={natType} portMapping={portMapping} />;
  }, [isError, isLoading, networkInfo]);

  return (
    <div>
      <ActionButton
        startIcon={<NetworkCheckIcon fill={colors.purpleLighter} style={{ height: 18, width: 18 }} />}
        color="secondary"
        variant="contained"
        onClick={openDialog}
      >
        Check network issues
      </ActionButton>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={onClose} fullWidth={true}>
        <DialogTitle>Network Diagnostics</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} marginBottom={1}>
            Turn VPN off for best results.
          </Typography>
          <div>{networkDiagnosticsContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
