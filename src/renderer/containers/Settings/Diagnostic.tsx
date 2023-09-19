import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import LoadingButton from "@mui/lab/LoadingButton";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import React from "react";

import { SettingItem } from "./SettingItem";

const buttonStyle = { marginLeft: "8px", width: "96px" };
const hiddenIpAddress = "***.***.***.***";

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

const getIpAddressTitle = (natType: NatType) => {
  if (natType === NatType.FAILED) {
    return "Failed to determine IP Address";
  }
  return "External IP Address (Don't show publicly)";
};

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

export const Diagnostic = React.memo(() => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [ipAddress, setIpAddress] = React.useState("");
  const [natType, setNatType] = React.useState(NatType.UNKNOWN);
  const [portMapping, setPortMapping] = React.useState({
    upnp: Presence.UNKNOWN,
    natpmp: Presence.UNKNOWN,
  } as PortMapping);
  const [cgnat, setCgnat] = React.useState(Presence.UNKNOWN);

  const runNatCgnatDiagnostics = async () => {
    let resNat;
    try {
      resNat = await window.electron.common.runDiagnosticNat();
      setIpAddress(resNat.address);
      setNatType(resNat.natType);
    } catch {
      setNatType(NatType.FAILED);
      return;
    }
    try {
      const resCgnat = await window.electron.common.runDiagnosticCgnat(resNat.address);
      setCgnat(resCgnat.cgnat);
    } catch {
      setCgnat(Presence.FAILED);
    }
  };

  const runDiagnostic = async () => {
    const portMappingPromise = window.electron.common
      .runDiagnosticPortMapping()
      .then((resPortMapping) => {
        setPortMapping(resPortMapping);
      })
      .catch(() => {
        setPortMapping({ upnp: Presence.FAILED, natpmp: Presence.FAILED });
      });
    await Promise.all([runNatCgnatDiagnostics(), portMappingPromise]);
  };

  const openDialog = async () => {
    setIpAddress("");
    setNatType(NatType.UNKNOWN);
    setPortMapping({ upnp: Presence.UNKNOWN, natpmp: Presence.UNKNOWN });
    setCgnat(Presence.UNKNOWN);
    setDialogOpen(true);
    await runDiagnostic();
  };

  const ipAddressTitle = getIpAddressTitle(natType);
  const [ipAddressCopied, setIpAddressCopied] = React.useState(false);
  const onIpAddressCopy = React.useCallback(() => {
    window.electron.clipboard.writeText(ipAddress);
    setIpAddressCopied(true);
    window.setTimeout(() => setIpAddressCopied(false), 2000);
  }, [ipAddress]);
  const [ipAddressHidden, setIpAddressHidden] = React.useState(true);
  const onIpAddressShowHide = () => {
    setIpAddressHidden(!ipAddressHidden);
  };
  const natTypeTitle = getNatTypeTitle(natType);
  const natTypeDescription = getNatTypeDescription(natType);
  const getNatTypeSection = () => {
    switch (natType) {
      case NatType.UNKNOWN:
        return (
          <>
            <Typography variant="subtitle2">{ipAddressTitle}</Typography>
            <LoadingButton loading={true} />
            <Typography variant="subtitle2">{natTypeTitle}</Typography>
            <LoadingButton loading={true} />
          </>
        );
      case NatType.FAILED:
        return (
          <>
            <Typography variant="subtitle2">{ipAddressTitle}</Typography>
            <Typography variant="subtitle2">{natTypeTitle}</Typography>
            <DialogBody>{natTypeDescription}</DialogBody>
          </>
        );
      default:
        return (
          <>
            <Typography variant="subtitle2">{ipAddressTitle}</Typography>
            <DialogBody>
              <InputBase css={inputBaseCss} disabled={true} value={ipAddressHidden ? hiddenIpAddress : ipAddress} />
              <Button variant="contained" color="secondary" onClick={onIpAddressCopy} style={buttonStyle}>
                {ipAddressCopied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="contained" color="secondary" onClick={onIpAddressShowHide} style={buttonStyle}>
                {ipAddressHidden ? "Show" : "Hide"}
              </Button>
            </DialogBody>
            <Typography variant="subtitle2">{natTypeTitle}</Typography>
            <DialogBody>{natTypeDescription}</DialogBody>
          </>
        );
    }
  };

  const portMappingTitle = getPortMappingTitle(portMapping);
  const portMappingDescription = getPortMappingDescription(portMapping);
  const getPortMappingSection = () => {
    if (portMapping.upnp === Presence.UNKNOWN || portMapping.natpmp === Presence.UNKNOWN) {
      return (
        <>
          <Typography variant="subtitle2">{portMappingTitle}</Typography>
          <LoadingButton loading={true} />
        </>
      );
    }
    return (
      <>
        <Typography variant="subtitle2">{portMappingTitle}</Typography>
        <DialogBody>{portMappingDescription}</DialogBody>
      </>
    );
  };

  const cgnatTitle = getCgnatTitle(cgnat);
  const cgnatDescription = getCgnatDescription(cgnat);
  const tracerouteCommand = window.electron.common.isWindows ? "tracert" : "traceroute";
  const cgnatCommand = `${tracerouteCommand} ${ipAddress}`;
  const displayedCgnatCommand = `${tracerouteCommand} ${ipAddressHidden ? hiddenIpAddress : ipAddress}`;
  const [cgnatCommandCopied, setCgnatCommandCopied] = React.useState(false);
  const onCgnatCommandCopy = React.useCallback(() => {
    window.electron.clipboard.writeText(cgnatCommand);
    setCgnatCommandCopied(true);
    window.setTimeout(() => setCgnatCommandCopied(false), 2000);
  }, [cgnatCommand]);
  const getCgnatSection = () => {
    if (cgnat === Presence.UNKNOWN) {
      return (
        <>
          <Typography variant="subtitle2">{cgnatTitle}</Typography>
          <LoadingButton loading={true} />
        </>
      );
    }
    if (cgnat === Presence.FAILED && !ipAddress) {
      return <></>;
    }
    return (
      <>
        <Typography variant="subtitle2">{cgnatTitle}</Typography>
        <DialogBody>{cgnatDescription}</DialogBody>
      </>
    );
  };

  const getCgnatCommandSection = () => {
    if (cgnat === Presence.FAILED && ipAddress) {
      return (
        <>
          <Typography variant="subtitle2">{"Run this command (Don't show publicly)"}</Typography>
          <AlignCenterDiv>
            <InputBase css={inputBaseCss} disabled={true} value={displayedCgnatCommand} />
            <Button variant="contained" color="secondary" onClick={onCgnatCommandCopy} style={buttonStyle}>
              {cgnatCommandCopied ? "Copied!" : "Copy"}
            </Button>
          </AlignCenterDiv>
          <DialogBody>
            {"More than one hop to your external IP address indicates CGNAT or Double NAT (or VPN)."}
          </DialogBody>
        </>
      );
    }
    return <></>;
  };

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
    <SettingItem
      name="Network Diagnostic"
      description="Checks NAT type, port mapping availability, and CGNAT presence. Turn VPN off for accurate results."
    >
      <Button color="secondary" variant="contained" onClick={openDialog}>
        Run diagnostic
      </Button>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={() => setDialogOpen(false)} fullWidth={true}>
        <DialogTitle>Network Diagnostic</DialogTitle>
        <DialogContent>
          {getNatTypeSection()}
          {getPortMappingSection()}
          {getCgnatSection()}
          {getCgnatCommandSection()}
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
    </SettingItem>
  );
});
