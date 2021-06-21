/** @jsx jsx */

import { css, jsx } from "@emotion/react";
import { StoredConnection } from "@settings/types";
import React from "react";

import { useSettings } from "@/lib/hooks/useSettings";

export interface SavedConnectionsListProps {
  onDelete: (conn: StoredConnection) => void;
  onEdit: (conn: StoredConnection) => void;
  onConnect: (conn: StoredConnection) => void;
  onMirror: (conn: StoredConnection) => void;
}

export const SavedConnectionsList: React.FC<SavedConnectionsListProps> = ({
  onEdit,
  onConnect,
  onMirror,
  onDelete,
}) => {
  const savedConnections = useSettings((store) => store.connections);
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {savedConnections.length === 0 ? (
        <div>No saved connections</div>
      ) : (
        <div>
          {savedConnections.map((conn) => {
            return (
              <div key={conn.id}>
                <div>{JSON.stringify(conn)}</div>
                <button onClick={() => onEdit(conn)}>Edit</button>
                <button onClick={() => onDelete(conn)}>Delete</button>
                <button onClick={() => onMirror(conn)}>Mirror</button>
                <button onClick={() => onConnect(conn)}>Connect</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
