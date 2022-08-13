import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { StoredConnection } from "@settings/types";
import { ConnectionStatus } from "@slippi/slippi-js";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { ExternalLink as A } from "@/components/ExternalLink";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/FormInputs";
import type { EditConnectionType } from "@/lib/consoleConnection";
import { addConsoleConnection, deleteConsoleConnection, editConsoleConnection } from "@/lib/consoleConnection";
import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { AddConnectionDialog } from "./AddConnectionDialog";
import { NewConnectionList } from "./NewConnectionList";
import { SavedConnectionsList } from "./SavedConnectionsList";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const Console: React.FC = () => {
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
                <h1>Console Mirror</h1> <MirroringHelp />
              </div>
              <Button onClick={() => setModalOpen(true)} startIcon={<AddIcon />}>
                New connection
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
    </Outer>
  );
};

const MirroringHelp = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      <div onClick={() => setModalOpen(true)}>
        <HelpOutline
          css={css`
            padding-left: 5px;
            padding-top: 17px;
            cursor: pointer;
            opacity: 0.5;
            transform: scale(0.7);
          `}
        ></HelpOutline>
      </div>
      <Dialog open={modalOpen} closeAfterTransition={true} onClose={() => setModalOpen(false)}>
        <DialogTitle>What is Mirroring?</DialogTitle>
        <DialogContent>
          <div>
            Slippi Mirroring allows for streaming replays from a console to a PC for real time playback. Checkout the{" "}
            <A
              href="https://docs.google.com/document/d/1ezavBjqVGbVO8aqSa5EHfq7ZflrTCvezRYjOf51MOWg/edit"
              css={css`
                color: ${colors.greenDark};
                text-decoration: underline;
              `}
            >
              mirroring guide
            </A>{" "}
            for setup instructions.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
