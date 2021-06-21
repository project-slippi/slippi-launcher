/** @jsx jsx */
import { startDiscovery, stopDiscovery } from "@console/ipc";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@material-ui/icons/Add";
import { StoredConnection } from "@settings/types";
import React from "react";

import { BasicFooter } from "@/components/BasicFooter";
import { DualPane } from "@/components/DualPane";
import { Button } from "@/components/FormInputs";
import {
  addConsoleConnection,
  deleteConsoleConnection,
  EditConnectionType,
  editConsoleConnection,
} from "@/lib/consoleConnection";
import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";
import { useSettings } from "@/lib/hooks/useSettings";

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
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentFormValues, setCurrentFormValues] = React.useState<Partial<StoredConnection> | null>(null);
  const savedConnections = useSettings((store) => store.connections);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const availableConsoles = useConsoleDiscoveryStore((store) => store.consoleItems);
  const consoleItemsToShow = availableConsoles.filter((item) => !savedIps.includes(item.ip));

  React.useEffect(() => {
    // Start scanning for new consoles
    startDiscovery.renderer!.trigger({});

    // Stop scanning on component unmount
    return () => {
      stopDiscovery.renderer!.trigger({});
    };
  }, []);

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
              <h1>Console Mirror</h1>
              <Button onClick={() => setModalOpen(true)} startIcon={<AddIcon />}>
                New connection
              </Button>
              <h2>Saved Connections</h2>
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
      <BasicFooter>Hello world</BasicFooter>
      <AddConnectionDialog
        open={modalOpen}
        selectedConnection={currentFormValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </Outer>
  );
};
