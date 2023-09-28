import { colors } from "@common/colors";
import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import { css } from "@emotion/react";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";

import { Button as ActionButton } from "@/components/FormInputs";

import { CgnatCommandSection } from "./CgnatCommandSection";
import { CgnatSection } from "./CgnatSection";
import { NatTypeSection } from "./NatTypeSection";
import { PortMappingSection } from "./PortMappingSection";

const getNatTypeTitle = (natType: NatType) => {
  if (natType === NatType.FAILED) {
    return "Failed to determine NAT type";
  }
  return "NAT Type";
};

const getNatTypeDescription = (natType: NatType) => {
  switch (natType) {
    case NatType.NORMAL:
      return `Normal NAT - This is the optimal result. Also known as "easy", "full cone", or "open" NAT.`;
    case NatType.SYMMETRIC:
      return `Symmetric NAT - You may have trouble connecting to other players.
        Also known as "hard" or "strict" NAT.
        If possible, please check your router settings to see if this can be changed to "easy", "full cone", "normal", or "open" NAT.`;
    case NatType.FAILED:
      return `Please try again later.
        If the failure persists, this network may block UDP.
        In that case it will not be possible to use Slippi as well as many other online games and apps.`;
    default:
      return "";
  }
};

const getPortMappingTitle = (portMapping: PortMapping) => {
  if (portMapping.upnp === Presence.FAILED || portMapping.natpmp === Presence.FAILED) {
    return "Failed to determine port mapping availability";
  }
  return "Port mapping";
};

const getPortMappingDescription = (portMapping: PortMapping) => {
  if (portMapping.upnp === Presence.ABSENT && portMapping.natpmp === Presence.ABSENT) {
    return "Not available.";
  }
  if (portMapping.upnp === Presence.PRESENT && portMapping.natpmp === Presence.ABSENT) {
    return "Available - UPnP.";
  }
  if (portMapping.upnp === Presence.ABSENT && portMapping.natpmp === Presence.PRESENT) {
    return "Available - NAT-PMP.";
  }
  if (portMapping.upnp === Presence.PRESENT && portMapping.natpmp === Presence.PRESENT) {
    return "Available - UPnP and NAT-PMP.";
  }
  if (portMapping.upnp === Presence.FAILED || portMapping.natpmp === Presence.FAILED) {
    return "Please try again later.";
  }
  return "";
};

const getCgnatTitle = (presence: Presence) => {
  if (presence === Presence.FAILED) {
    return "Failed to determine CGNAT or Double NAT presence";
  }
  return "CGNAT or Double NAT";
};

const getCgnatDescription = (presence: Presence) => {
  switch (presence) {
    case Presence.ABSENT:
      return "Not detected - This is the optimal result.";
    case Presence.PRESENT:
      return "Detected (it could also be a VPN) - You may have trouble connecting to other players.";
    case Presence.FAILED:
      return `Please try again later.
        If the failure persists, you can test this in your computer's terminal app.
        See below:`;
    default:
      return "";
  }
};

export const NetworkDiagnosticsButton = React.memo(() => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [ipAddress, setIpAddress] = React.useState("");
  const [natType, setNatType] = React.useState(NatType.UNKNOWN);
  const [portMapping, setPortMapping] = React.useState({
    upnp: Presence.UNKNOWN,
    natpmp: Presence.UNKNOWN,
  } as PortMapping);
  const [cgnat, setCgnat] = React.useState(Presence.UNKNOWN);

  const runNetworkDiagnostics = async () => {
    const { address, cgnat, natType, portMapping } = await window.electron.common.runNetworkDiagnostics();
    setIpAddress(address);
    setCgnat(cgnat);
    setNatType(natType);
    setPortMapping(portMapping);
  };

  const openDialog = async () => {
    setIpAddress("");
    setNatType(NatType.UNKNOWN);
    setPortMapping({ upnp: Presence.UNKNOWN, natpmp: Presence.UNKNOWN });
    setCgnat(Presence.UNKNOWN);
    setDialogOpen(true);
    await runNetworkDiagnostics();
  };

  const natTypeTitle = getNatTypeTitle(natType);
  const natTypeDescription = getNatTypeDescription(natType);
  const portMappingTitle = getPortMappingTitle(portMapping);
  const portMappingDescription = getPortMappingDescription(portMapping);
  const cgnatTitle = getCgnatTitle(cgnat);
  const cgnatDescription = getCgnatDescription(cgnat);

  const [diagnosticResultsCopied, setDiagnosticResultsCopied] = React.useState(false);
  const onDiagnosticResultsCopy = React.useCallback(() => {
    let diagnosticResults = `${natTypeTitle}\n${natTypeDescription}\n\n${portMappingTitle}\n${portMappingDescription}`;
    if (ipAddress) {
      diagnosticResults += `\n\n${cgnatTitle}\n${cgnatDescription}`;
    }
    window.electron.clipboard.writeText(diagnosticResults);
    setDiagnosticResultsCopied(true);
    window.setTimeout(() => setDiagnosticResultsCopied(false), 2000);
  }, [
    cgnatDescription,
    cgnatTitle,
    ipAddress,
    natTypeDescription,
    natTypeTitle,
    portMappingDescription,
    portMappingTitle,
  ]);

  return (
    <>
      <ActionButton
        startIcon={<NetworkCheckIcon fill={colors.purpleLighter} style={{ height: 18, width: 18 }} />}
        color="secondary"
        variant="contained"
        onClick={openDialog}
      >
        Check network issues
      </ActionButton>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={() => setDialogOpen(false)} fullWidth={true}>
        <DialogTitle>Network Diagnostic</DialogTitle>
        <DialogContent
          css={css`
            padding-bottom: 0;
          `}
        >
          Turn VPN off for accurate results
        </DialogContent>
        <DialogContent>
          <NatTypeSection address={ipAddress} description={natTypeDescription} natType={natType} title={natTypeTitle} />
          <PortMappingSection description={portMappingDescription} portMapping={portMapping} title={portMappingTitle} />
          <CgnatSection address={ipAddress} cgnat={cgnat} description={cgnatDescription} title={cgnatTitle} />
          <CgnatCommandSection address={ipAddress} cgnat={cgnat} />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={onDiagnosticResultsCopy}
            disabled={
              natType === NatType.UNKNOWN ||
              portMapping.upnp === Presence.UNKNOWN ||
              portMapping.natpmp === Presence.UNKNOWN ||
              cgnat === Presence.UNKNOWN
            }
            style={{ width: "144px" }}
          >
            {diagnosticResultsCopied ? "Copied!" : "Copy results"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
