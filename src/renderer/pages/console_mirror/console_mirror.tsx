import { ConnectionStatus } from "@console/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import type { StoredConnection } from "@settings/types";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { ExternalLink as A } from "@/components/external_link";
import { Footer } from "@/components/footer/footer";
import { Button } from "@/components/form/button";
import { Toggle } from "@/components/form/toggle";
import { getConnectionsToAutoConnect } from "@/lib/auto_connect";
import type { EditConnectionType } from "@/lib/console_connection";
import {
  addConsoleConnection,
  buildMirrorConfig,
  deleteConsoleConnection,
  editConsoleConnection,
} from "@/lib/console_connection";
import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useEnableAutoConnect, useSettings } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { AddConnectionDialog } from "./add_connection_dialog/add_connection_dialog";
import { ConsoleMirrorMessages as Messages } from "./console_mirror.messages";
import { NewConnectionList } from "./new_connection_list/new_connection_list";
import { SavedConnectionsList } from "./saved_connections_list/saved_connections_list";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const ConsoleMirror = React.memo(() => {
  const { consoleService } = useServices();
  const [isScanning, setIsScanning] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentFormValues, setCurrentFormValues] = React.useState<Partial<StoredConnection> | undefined>();
  const savedConnections = useSettings((store) => store.connections);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const availableConsoles = useConsoleDiscoveryStore((store) => store.consoleItems);
  const connectedConsoles = useConsoleDiscoveryStore((store) => store.connectedConsoles);
  const autoConnectOptOutIps = useConsoleDiscoveryStore((store) => store.autoConnectOptOutIps);
  const clearAutoConnectOptOuts = useConsoleDiscoveryStore((store) => store.clearAutoConnectOptOuts);
  const [enableAutoConnect, setEnableAutoConnect] = useEnableAutoConnect();
  const consoleItemsToShow = availableConsoles.filter((item) => !savedIps.includes(item.ip));
  const consoleIsConnected = React.useCallback(
    (ipAddress?: string): boolean => {
      if (!ipAddress) {
        return false;
      }
      const status = connectedConsoles[ipAddress]?.status;
      return status != null && status !== ConnectionStatus.DISCONNECTED;
    },
    [connectedConsoles],
  );

  const { showError } = useToasts();

  React.useEffect(() => {
    // Start scanning for new consoles
    setIsScanning(false);
    consoleService
      .startDiscovery()
      .then(() => setIsScanning(true))
      .catch(showError);

    // Stop scanning on component unmount
    return () => {
      void consoleService.stopDiscovery();
    };
  }, [showError, consoleService]);

  // Tracks IPs we've issued a connect for but haven't yet received a status update from,
  // so repeated discovery updates don't fire duplicate connect attempts. A ref is used so
  // that mutating it doesn't trigger a re-render (and in turn re-run this effect).
  const inFlightConnectionsRef = React.useRef<Set<string>>(new Set());

  // Automatically connect to saved consoles as they appear on the network.
  React.useEffect(() => {
    const inFlightIps = inFlightConnectionsRef.current;

    // Once a console reports a terminal disconnected state, stop treating it as in-flight so
    // it can be auto-connected again (e.g. after dropping off the network and returning).
    for (const [ip, info] of Object.entries(connectedConsoles)) {
      if (info.status === ConnectionStatus.DISCONNECTED) {
        inFlightIps.delete(ip);
      }
    }

    const availableIps = new Set(availableConsoles.map((item) => item.ip));
    const optedOutIps = new Set(Object.keys(autoConnectOptOutIps));
    const toConnect = getConnectionsToAutoConnect({
      enabled: enableAutoConnect,
      savedConnections,
      availableIps,
      connectedConsoles,
      inFlightIps,
      optedOutIps,
    });
    for (const conn of toConnect) {
      inFlightIps.add(conn.ipAddress);
      consoleService.connectToConsoleMirror(buildMirrorConfig(conn)).catch((err) => {
        // Allow a failed attempt to be retried on a subsequent discovery update.
        inFlightIps.delete(conn.ipAddress);
        showError(err);
      });
    }
  }, [
    enableAutoConnect,
    availableConsoles,
    savedConnections,
    connectedConsoles,
    autoConnectOptOutIps,
    consoleService,
    showError,
  ]);

  const onCancel = () => {
    setModalOpen(false);
    setCurrentFormValues(undefined);
  };

  const onSubmit = async (data: EditConnectionType) => {
    if (currentFormValues && currentFormValues.id !== undefined) {
      // We're editing an existing connection
      await editConsoleConnection(currentFormValues.id, data);
    } else {
      // This is a new connection
      await addConsoleConnection(data);
    }

    // Close the dialog
    onCancel();
  };

  return (
    <Outer>
      <div
        css={css`
          display: flex;
          flex: 1;
          position: relative;
          overflow: hidden;
        `}
      >
        <DualPane
          id="console-mirror-page"
          leftSide={
            <div
              css={css`
                padding-right: 10px;
                padding-left: 20px;
                flex: 1;
              `}
            >
              <div
                css={css`
                  display: flex;
                  align-items: center;
                `}
              >
                <h1>{Messages.consoleMirror()}</h1> <MirroringHelp />
              </div>
              <Button onClick={() => setModalOpen(true)} startIcon={<AddIcon />}>
                {Messages.newConnection()}
              </Button>
              <div
                css={css`
                  max-width: 480px;
                  margin-top: 20px;
                `}
              >
                <Toggle
                  value={enableAutoConnect}
                  onChange={(checked) => {
                    // Re-enabling clears manual disconnects so all available consoles reconnect.
                    if (checked) {
                      clearAutoConnectOptOuts();
                    }
                    setEnableAutoConnect(checked).catch(showError);
                  }}
                  label={Messages.autoConnect()}
                  description={Messages.autoConnectDescription()}
                />
              </div>
              <SavedConnectionsList
                availableConsoles={availableConsoles}
                onEdit={(conn) => {
                  setCurrentFormValues(conn);
                  setModalOpen(true);
                }}
                onDelete={(conn) => deleteConsoleConnection(conn.id)}
              />
            </div>
          }
          rightSide={
            <div
              css={css`
                padding: 20px;
                padding-left: 10px;
                flex: 1;
              `}
            >
              <NewConnectionList
                isScanning={isScanning}
                consoleItems={consoleItemsToShow}
                onClick={(item) => {
                  setCurrentFormValues({ ipAddress: item.ip });
                  setModalOpen(true);
                }}
              />
            </div>
          }
          style={{ gridTemplateColumns: "auto 400px" }}
        />
      </div>
      <Footer />
      <AddConnectionDialog
        open={modalOpen}
        selectedConnection={currentFormValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
        disabled={consoleIsConnected(currentFormValues?.ipAddress)}
      />
    </Outer>
  );
});

const MirroringHelp = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      <IconButton
        onClick={() => setModalOpen(true)}
        css={css`
          opacity: 0.5;
          margin-top: 10px;
        `}
      >
        <HelpOutline
          css={css`
            font-size: 20px;
          `}
        />
      </IconButton>
      <Dialog open={modalOpen} closeAfterTransition={true} onClose={() => setModalOpen(false)}>
        <DialogTitle>{Messages.whatIsMirroring()}</DialogTitle>
        <DialogContent>
          <p>{Messages.slippiMirroringDescription()}</p>
          <p
            css={css`
              a {
                text-decoration: underline;
              }
            `}
          >
            <A href="https://docs.google.com/document/d/1ezavBjqVGbVO8aqSa5EHfq7ZflrTCvezRYjOf51MOWg">
              {Messages.mirroringGuide()}
            </A>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
