import styled from "@emotion/styled";
import React from "react";

import { TwitterFeed } from "./TwitterFeed";

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const SideBar: React.FC = () => {
  return (
    <Outer>
      <TwitterFeed />
    </Outer>
  );
};
