/** @jsx jsx */
import { DiscoveredConsoleInfo } from "@console/types";
import { css, jsx } from "@emotion/react";
import React from "react";

import { InfoBlock } from "@/components/InfoBlock";
import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";
import { useSettings } from "@/lib/hooks/useSettings";

import { NewConnectionItem } from "./NewConnectionItem";

export interface NewConnectionListProps {
  onClick: (conn: DiscoveredConsoleInfo) => void;
}

export const NewConnectionList: React.FC<NewConnectionListProps> = ({ onClick }) => {
  const savedConnections = useSettings((store) => store.connections);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const allConsoleItems = useConsoleDiscoveryStore((store) => store.consoleItems);
  const consoleItemsToShow = allConsoleItems.filter((item) => !savedIps.includes(item.ip));
  return (
    <InfoBlock
      title={
        <div
          css={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <span>New Connections</span>
          <span>({consoleItemsToShow.length})</span>
        </div>
      }
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
        `}
      >
        {consoleItemsToShow.length > 0 ? (
          consoleItemsToShow.map((item) => {
            return <NewConnectionItem key={item.ip} onAdd={() => onClick(item)} ip={item.ip} nickname={item.name} />;
          })
        ) : (
          <div>Consoles detected on the network will show up here.</div>
        )}
      </div>
    </InfoBlock>
  );
};
