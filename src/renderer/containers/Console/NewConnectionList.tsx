/** @jsx jsx */
import { DiscoveredConsoleInfo } from "@console/types";
import { css, jsx } from "@emotion/react";
import React from "react";

import { InfoBlock } from "@/components/InfoBlock";

import { NewConnectionItem } from "./NewConnectionItem";

export interface NewConnectionListProps {
  consoleItems: DiscoveredConsoleInfo[];
  onClick: (conn: DiscoveredConsoleInfo) => void;
}

export const NewConnectionList: React.FC<NewConnectionListProps> = ({ consoleItems, onClick }) => {
  return (
    <InfoBlock title={`New Connections (${consoleItems.length})`}>
      <div
        css={css`
          display: flex;
          flex-direction: column;
        `}
      >
        {consoleItems.length > 0 ? (
          consoleItems.map((item) => {
            return <NewConnectionItem key={item.ip} onAdd={() => onClick(item)} ip={item.ip} nickname={item.name} />;
          })
        ) : (
          <div>Consoles detected on the network will show up here.</div>
        )}
      </div>
    </InfoBlock>
  );
};
