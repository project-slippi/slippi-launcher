import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { CgnatCommandSection } from "./cgnat_command_section";
import { NatTypeSection } from "./nat_type_section";
import { NetworkDiagnosticsResultMessages as Messages } from "./network_diagnostics_result.messages";

const styles = stylex.create({
  contentBody: {
    marginBottom: "1em",
  },
});

const getNatTypeTitle = (natType: NatType) => {
  if (natType === NatType.FAILED) {
    return Messages.failedToDetermineNatType();
  }
  return Messages.natType();
};

const getNatTypeDescription = (natType: NatType): string => {
  switch (natType) {
    case NatType.NORMAL:
      return `${Messages.normalNat()} - ${Messages.normalNatDescription()}`;
    case NatType.SYMMETRIC:
      return `${Messages.symmetricNat()} - ${Messages.symmetricNatDescription()}`;
    case NatType.FAILED:
      return Messages.failedNatTypeDescription();
    default:
      return "";
  }
};

const getPortMappingTitle = (portMapping: PortMapping) => {
  if (portMapping.upnp === Presence.FAILED || portMapping.natpmp === Presence.FAILED) {
    return Messages.failedToDeterminePortMapping();
  }
  return Messages.portMapping();
};

const getPortMappingDescription = (portMapping: PortMapping): string => {
  if (portMapping.upnp === Presence.ABSENT && portMapping.natpmp === Presence.ABSENT) {
    return Messages.notAvailable();
  }
  if (portMapping.upnp === Presence.PRESENT && portMapping.natpmp === Presence.ABSENT) {
    return `${Messages.available()} - ${Messages.upnp()}`;
  }
  if (portMapping.upnp === Presence.ABSENT && portMapping.natpmp === Presence.PRESENT) {
    return `${Messages.available()} - ${Messages.natpmp()}`;
  }
  if (portMapping.upnp === Presence.PRESENT && portMapping.natpmp === Presence.PRESENT) {
    return `${Messages.available()} - ${Messages.upnpAndNatpmp()}`;
  }
  if (portMapping.upnp === Presence.FAILED || portMapping.natpmp === Presence.FAILED) {
    return Messages.pleaseTryAgainLater();
  }
  return "";
};

const getCgnatTitle = (presence: Presence) => {
  if (presence === Presence.FAILED) {
    return Messages.failedToDetermineCgnatOrDoubleNat();
  }
  return Messages.cgnatOrDoubleNat();
};

const getCgnatDescription = (address: string, presence: Presence) => {
  switch (presence) {
    case Presence.ABSENT:
      return `${Messages.notDetected()} - ${Messages.thisIsTheOptimalResult()}`;
    case Presence.PRESENT:
      return `${Messages.detectedItCouldAlsoBeAVpn()} - ${Messages.youMayHaveTrouble()}`;
    case Presence.FAILED: {
      let failedDescription = Messages.pleaseTryAgainLater();
      if (address) {
        failedDescription += `${Messages.ifTheFailurePersists()}`;
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
      navigator.clipboard
        .writeText(diagnosticResults)
        .then(() => {
          setDiagnosticResultsCopied(true);
          window.setTimeout(() => setDiagnosticResultsCopied(false), 2000);
        })
        .catch(console.error);
    }, [cgnatDescription, cgnatTitle, natTypeDescription, natTypeTitle, portMappingDescription, portMappingTitle]);

    return (
      <div>
        <div>
          <NatTypeSection address={ipAddress} description={natTypeDescription} natType={natType} title={natTypeTitle} />
          <Typography variant="subtitle2">{portMappingTitle}</Typography>
          <div {...stylex.props(styles.contentBody)}>{portMappingDescription}</div>
          <Typography variant="subtitle2">{cgnatTitle}</Typography>
          <div {...stylex.props(styles.contentBody)}>{cgnatDescription}</div>
          {cgnat === Presence.FAILED && ipAddress && <CgnatCommandSection address={ipAddress} />}
        </div>
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onDiagnosticResultsCopy} style={{ width: "auto" }}>
            {diagnosticResultsCopied ? Messages.copied() : Messages.copyResults()}
          </Button>
        </DialogActions>
      </div>
    );
  },
);
