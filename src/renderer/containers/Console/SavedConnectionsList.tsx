/** @jsx jsx */

import { css, jsx } from "@emotion/react";
import React from "react";

import { useSettings } from "@/lib/hooks/useSettings";
export const SavedConnectionsList: React.FC = () => {
  const savedConnections = useSettings((store) => store.connections);
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {savedConnections.length === 0 ? (
        <div>no saved connections</div>
      ) : (
        <div>
          {savedConnections.map((conn) => {
            return <div key={conn.id}>{JSON.stringify(conn)}</div>;
          })}
        </div>
      )}
    </div>
  );
};
