import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import React from "react";

import { SettingItem } from "./SettingItem";

const DialogBody = styled.div`
  margin-bottom: 1em;
`;

const getNatTypeCommentary = (natType: NatType) => {
  switch (natType) {
    case NatType.NORMAL:
      return (
        'Normal NAT - This is the most desirable NAT type. Also known as "easy", "full cone", "moderate", "open", ' +
        '"port restricted cone", or "restricted cone" NAT.'
      );
    case NatType.SYMMETRIC:
      return (
        'Symmetric NAT - You may have trouble connecting to other players. Also known as "hard" or "strict" NAT. ' +
        'If possible, please check your router settings to see if this can be changed to "easy", "full cone", ' +
        '"moderate", "normal", "open", "port restricted cone", or "restricted cone" NAT.'
      );
    case NatType.FAILED:
      return (
        "Please try again later. If the failure persists, this network may block UDP. In that case it will " +
        "not be possible to use Slippi as well as many other online games and apps."
      );
    default:
      return "";
  }
};

const getPortMappingCommentary = (portMapping: PortMapping) => {
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

const getCgnatCommentary = (presence: Presence) => {
  switch (presence) {
    case Presence.ABSENT:
      return "Not detected - This is the most desirable result.";
    case Presence.PRESENT:
      return "Detected (it could also be a VPN) - You may have trouble connecting to other players.";
    case Presence.FAILED:
      return (
        "Please try again later. If the failure persists, you can test this in your computer's terminal app. More " +
        "than one hop to your external IP address indicates CGNAT, Double NAT, or VPN:"
      );
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
      resNat = await window.electron.common.diagnosticNat();
      setIpAddress(resNat.address);
      setNatType(resNat.natType);
    } catch {
      setNatType(NatType.FAILED);
      return;
    }
    try {
      const resCgnat = await window.electron.common.diagnosticCgnat(resNat.address);
      setCgnat(resCgnat.cgnat);
    } catch {
      setCgnat(Presence.FAILED);
    }
  };

  const runDiagnostic = async () => {
    const portMappingPromise = window.electron.common
      .diagnosticPortMapping()
      .then((resPortMapping) => {
        setPortMapping(resPortMapping);
      })
      .catch(() => {
        setPortMapping({ upnp: Presence.FAILED, natpmp: Presence.FAILED });
      });
    return Promise.all([runNatCgnatDiagnostics(), portMappingPromise]);
  };

  const openDialog = () => {
    setIpAddress("");
    setNatType(NatType.UNKNOWN);
    setPortMapping({ upnp: Presence.UNKNOWN, natpmp: Presence.UNKNOWN });
    setCgnat(Presence.UNKNOWN);
    setDialogOpen(true);
    return runDiagnostic();
  };

  const natTypeCommentary = getNatTypeCommentary(natType);
  const natTypeSection =
    natType === NatType.UNKNOWN ? (
      <>
        <Typography variant="subtitle2">{"IP Address"}</Typography>
        <LoadingButton loading={true} />
        <Typography variant="subtitle2">{"NAT Type"}</Typography>
        <LoadingButton loading={true} />
      </>
    ) : natType === NatType.FAILED ? (
      <>
        <Typography variant="subtitle2">{"Faield to determine IP Address"}</Typography>
        <Typography variant="subtitle2">{"Failed to determine NAT type"}</Typography>
        <DialogBody>{natTypeCommentary}</DialogBody>
      </>
    ) : (
      <>
        <Typography variant="subtitle2">{"IP Address"}</Typography>
        <DialogBody>{ipAddress}</DialogBody>
        <Typography variant="subtitle2">{"NAT Type"}</Typography>
        <DialogBody>{natTypeCommentary}</DialogBody>
      </>
    );

  const portMappingCommentary = getPortMappingCommentary(portMapping);
  const portMappingSection =
    portMapping.upnp === Presence.UNKNOWN || portMapping.natpmp === Presence.UNKNOWN ? (
      <>
        <Typography variant="subtitle2">{"Port mapping"}</Typography>
        <LoadingButton loading={true} />
      </>
    ) : portMapping.upnp === Presence.FAILED || portMapping.natpmp === Presence.FAILED ? (
      <>
        <Typography variant="subtitle2">{"Failed to determine port mapping availability"}</Typography>
        <DialogBody>{portMappingCommentary}</DialogBody>
      </>
    ) : (
      <>
        <Typography variant="subtitle2">{"Port mapping"}</Typography>
        <DialogBody>{portMappingCommentary}</DialogBody>
      </>
    );

  const cgnatCommentary = getCgnatCommentary(cgnat);
  const cgnatCommand = (window.electron.common.isWindows ? "tracert " : "traceroute ") + ipAddress;
  const [copied, setCopied] = React.useState(false);
  const onCopy = React.useCallback(() => {
    window.electron.clipboard.writeText(cgnatCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [cgnatCommand]);
  const cgnatSection =
    cgnat === Presence.UNKNOWN ? (
      <>
        <Typography variant="subtitle2">{"CGNAT or Double NAT"}</Typography>
        <LoadingButton loading={true} />
      </>
    ) : cgnat === Presence.FAILED && ipAddress ? (
      <>
        <Typography variant="subtitle2">{"Failed to determine CGNAT or Double NAT presence"}</Typography>
        <DialogBody>{cgnatCommentary}</DialogBody>
        <InputBase
          css={css`
            flex: 1;
            padding: 5px 10px;
            margin-right: 10px;
            border-radius: 10px;
            background-color: rgba(0, 0, 0, 0.4);
            font-size: 14px;
          `}
          disabled={true}
          value={cgnatCommand}
        />
        <Button variant="contained" color="secondary" onClick={onCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </>
    ) : cgnat === Presence.FAILED ? (
      <></>
    ) : (
      <>
        <Typography variant="subtitle2">{"CGNAT or Double NAT"}</Typography>
        <DialogBody>{cgnatCommentary}</DialogBody>
      </>
    );

  return (
    <SettingItem
      name="Network Diagnostic"
      description="Checks NAT type, port mapping capability, and CGNAT presence. Turn VPN off for accurate results."
    >
      <Button color="secondary" variant="contained" onClick={openDialog}>
        Run diagnostic
      </Button>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Network Diagnostic</DialogTitle>
        <DialogContent>
          {natTypeSection}
          {portMappingSection}
          {cgnatSection}
        </DialogContent>
      </Dialog>
    </SettingItem>
  );
});
