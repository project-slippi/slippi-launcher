/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import React from "react";

import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";

export const AvailableConsoleList: React.FC = () => {
  const consoleItems = useConsoleDiscoveryStore((store) => store.consoleItems);
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {consoleItems.length > 0 ? (
        consoleItems.map((item) => {
          return <div key={item.ip}>{JSON.stringify(item)}</div>;
        })
      ) : (
        <div>no items to show</div>
      )}
    </div>
  );
};
