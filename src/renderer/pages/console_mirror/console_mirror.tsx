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
import type { EditConnectionType } from "@/lib/console_connection";
import { addConsoleConnection, deleteConsoleConnection, editConsoleConnection } from "@/lib/console_connection";
import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useSettings } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { AddConnectionDialog } from "./add_connection_dialog/add_connection_dialog";
import { ConsoleMirrorMessages as Messages } from "./console_mirror.messages";
import { NewConnectionList } from "./new_connection_list/new_connection_list";
import { OBSWebsocketNotice } from "./obs_websocket_notice";
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
  const [currentFormValues, setCurrentFormValues] = React.useState<Partial<StoredConnection> | null>(null);
  const savedConnections = useSettings((store) => store.connections);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const availableConsoles = useConsoleDiscoveryStore((store) => store.consoleItems);
  const connectedConsoles = useConsoleDiscoveryStore((store) => store.connectedConsoles);
  const consoleItemsToShow = availableConsoles.filter((item) => !savedIps.includes(item.ip));
  const consoleIsConnected = React.useCallback(
    (ipAddress?: string): boolean => {
      if (!ipAddress) {
        return false;
      }
      const status = connectedConsoles[ipAddress]?.status ?? null;
      return status !== null && status !== ConnectionStatus.DISCONNECTED;
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

  const onCancel = () => {
    setModalOpen(false);
    setCurrentFormValues(null);
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
      <OBSWebsocketNotice />
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
