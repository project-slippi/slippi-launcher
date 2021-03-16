import React from "react";
import styled from "styled-components";

import { Advertisements } from "./Advertisements";
import { TwitterFeed } from "./TwitterFeed";

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const AdvertContainer = styled.div`
  height: 120px;
  width: 100%;
`;

export const SideBar: React.FC = () => {
  return (
    <Outer>
      <TwitterFeed />
      <AdvertContainer>
        <Advertisements />
      </AdvertContainer>
    </Outer>
  );
};
