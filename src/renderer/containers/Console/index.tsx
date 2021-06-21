import { startDiscovery, stopDiscovery } from "@console/ipc";
import styled from "@emotion/styled";
import { StoredConnection } from "@settings/types";
import React from "react";

import {
  addConsoleConnection,
  connectToConsole,
  deleteConsoleConnection,
  EditConnectionType,
  editConsoleConnection,
  startConsoleMirror,
} from "@/lib/consoleConnection";

import { AddConnectionDialog } from "./AddConnectionDialog";
import { NewConnectionList } from "./NewConnectionList";
import { SavedConnectionsList } from "./SavedConnectionsList";

export const Console: React.FC = () => {
  const [currentFormValues, setCurrentFormValues] = React.useState<Partial<StoredConnection> | null>(null);

  React.useEffect(() => {
    // Start scanning for new consoles
    startDiscovery.renderer!.trigger({});

    // Stop scanning on component unmount
    return () => {
      stopDiscovery.renderer!.trigger({});
    };
  }, []);

  const onCancel = () => setCurrentFormValues(null);

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
      <h1>Console</h1>
      <h2>Saved Connections</h2>
      <SavedConnectionsList
        onEdit={(conn) => setCurrentFormValues(conn)}
        onConnect={connectToConsole}
        onMirror={(conn) => startConsoleMirror(conn.ipAddress)}
        onDelete={(conn) => deleteConsoleConnection(conn.id)}
      />
      <h2>New Connections</h2>
      <NewConnectionList onClick={(item) => setCurrentFormValues({ ipAddress: item.ip })} />
      <AddConnectionDialog selectedConnection={currentFormValues} onSubmit={onSubmit} onCancel={onCancel} />
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 20px;
`;
