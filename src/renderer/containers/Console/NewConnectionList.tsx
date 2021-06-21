/** @jsx jsx */
import { DiscoveredConsoleInfo } from "@console/types";
import { css, jsx } from "@emotion/react";
import React from "react";

import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";
import { useSettings } from "@/lib/hooks/useSettings";

export interface NewConnectionListProps {
  onClick: (conn: DiscoveredConsoleInfo) => void;
}

export const NewConnectionList: React.FC<NewConnectionListProps> = ({ onClick }) => {
  const savedConnections = useSettings((store) => store.connections);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const allConsoleItems = useConsoleDiscoveryStore((store) => store.consoleItems);
  const consoleItemsToShow = allConsoleItems.filter((item) => !savedIps.includes(item.ip));
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {consoleItemsToShow.length > 0 ? (
        consoleItemsToShow.map((item) => {
          return (
            <div key={item.ip}>
              <div>{JSON.stringify(item)}</div>
              <button onClick={() => onClick(item)}>add</button>
            </div>
          );
        })
      ) : (
        <div>no items to show</div>
      )}
    </div>
  );
};
