import type { PortMapping } from "@common/types";
import { CgnatPresence, NatpmpPresence, NatType, UpnpPresence } from "@common/types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";

import { SettingItem } from "./SettingItem";

export const Diagnostic = React.memo(() => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [natType, setNatType] = React.useState(NatType.UNKNOWN);
  const [portMapping, setPortMapping] = React.useState({
    upnp: UpnpPresence.UNKNOWN,
    natpmp: NatpmpPresence.UNKNOWN,
  } as PortMapping);
  const [cgnat, setCgnat] = React.useState(CgnatPresence.UNKNOWN);

  const runDiagnostic = async () => {
    const resNat = await window.electron.common.diagnosticNat();
    const resPortMapping = await window.electron.common.diagnosticPortMapping();
    setNatType(resNat.natType);
    setPortMapping(resPortMapping);
    const resCgnat = await window.electron.common.diagnosticCgnat(resNat.address);
    setCgnat(resCgnat.cgnat);
  };
  const openDialog = () => {
    setDialogOpen(true);
    return runDiagnostic();
  };

  return (
    <SettingItem name="Network Diagnostic" description="Checks NAT type, port mapping capability, and CGNAT presence.">
      <Button color="secondary" variant="contained" onClick={openDialog}>
        Run diagnostic
      </Button>
      <Dialog open={dialogOpen} closeAfterTransition={true} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Network Diagnostic</DialogTitle>
        <DialogContent>
          {"NAT Type: "}
          {natType}
          {", Port Mapping: upnp: "}
          {portMapping.upnp}
          {", natpmp: "}
          {portMapping.natpmp}
          {", CGNAT: "}
          {cgnat}
        </DialogContent>
      </Dialog>
    </SettingItem>
  );
});
