import { colors } from "@common/colors";
import type { NatType, PortMapping, Presence } from "@common/types";
import { css } from "@emotion/react";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";

import { Button as ActionButton } from "@/components/FormInputs";

import { NetworkDiagnosticsResult } from "./NetworkDiagnosticsResult";

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

  const runNetworkDiagnostics = async () => {
    setIsLoading(true);
    setIsError(false);
    setNetworkInfo(undefined);
    await window.electron.common
      .runNetworkDiagnostics()
      .then(setNetworkInfo)
      .finally(() => setIsLoading(false));
  };

  const openDialog = async () => {
    setDialogOpen(true);
    await runNetworkDiagnostics();
  };

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
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={() => setDialogOpen(false)} fullWidth={true}>
        <DialogTitle>Network Diagnostics</DialogTitle>
        <DialogContent
          css={css`
            padding-bottom: 0;
          `}
        >
          Turn VPN off for best results.
        </DialogContent>
        <DialogContent>{networkDiagnosticsContent}</DialogContent>
      </Dialog>
    </div>
  );
});
