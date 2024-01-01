import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import React from "react";

import { CgnatCommandSection } from "./cgnat_command_section";
import { NatTypeSection } from "./nat_type_section";

const ContentBody = styled.div`
  margin-bottom: 1em;
`;

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

const getCgnatDescription = (address: string, presence: Presence) => {
  switch (presence) {
    case Presence.ABSENT:
      return "Not detected - This is the optimal result.";
    case Presence.PRESENT:
      return "Detected (it could also be a VPN) - You may have trouble connecting to other players.";
    case Presence.FAILED: {
      let failedDescription = "Please try again later.";
      if (address) {
        failedDescription += "If the failure persists, you can test this in your computer's terminal app. See below:";
      }
      return failedDescription;
    }
    default:
      return "";
  }
};

type NetworkDiagnosticsResultProps = {
  ipAddress: string;
  cgnat: Presence;
  natType: NatType;
  portMapping: PortMapping;
};

export const NetworkDiagnosticsResult = React.memo(
  ({ ipAddress, cgnat, natType, portMapping }: NetworkDiagnosticsResultProps) => {
    const natTypeTitle = getNatTypeTitle(natType);
    const natTypeDescription = getNatTypeDescription(natType);
    const portMappingTitle = getPortMappingTitle(portMapping);
    const portMappingDescription = getPortMappingDescription(portMapping);
    const cgnatTitle = getCgnatTitle(cgnat);
    const cgnatDescription = getCgnatDescription(ipAddress, cgnat);

    const [diagnosticResultsCopied, setDiagnosticResultsCopied] = React.useState(false);
    const onDiagnosticResultsCopy = React.useCallback(() => {
      const diagnosticResults = `${natTypeTitle}\n${natTypeDescription}\n\n${portMappingTitle}\n${portMappingDescription}\n\n${cgnatTitle}\n${cgnatDescription}`;
      window.electron.clipboard.writeText(diagnosticResults);
      setDiagnosticResultsCopied(true);
      window.setTimeout(() => setDiagnosticResultsCopied(false), 2000);
    }, [cgnatDescription, cgnatTitle, natTypeDescription, natTypeTitle, portMappingDescription, portMappingTitle]);

    return (
      <div>
        <div>
          <NatTypeSection address={ipAddress} description={natTypeDescription} natType={natType} title={natTypeTitle} />
          <Typography variant="subtitle2">{portMappingTitle}</Typography>
          <ContentBody>{portMappingDescription}</ContentBody>
          <Typography variant="subtitle2">{cgnatTitle}</Typography>
          <ContentBody>{cgnatDescription}</ContentBody>
          {cgnat === Presence.FAILED && ipAddress && <CgnatCommandSection address={ipAddress} />}
        </div>
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onDiagnosticResultsCopy} style={{ width: "144px" }}>
            {diagnosticResultsCopied ? "Copied!" : "Copy results"}
          </Button>
        </DialogActions>
      </div>
    );
  },
);
