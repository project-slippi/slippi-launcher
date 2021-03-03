import React from "react";
import { TwitterTimelineEmbed } from "react-twitter-embed";
import styled from "styled-components";

import { Advertisements } from "./Advertisements";

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const TwitterFeedContainer = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  & > div {
    height: 100%;
    width: 100%;
  }
`;

const AdvertContainer = styled.div`
  height: 120px;
  width: 100%;
`;

export const SideBar: React.FC = () => {
  return (
    <Outer>
      <TwitterFeedContainer>
        <TwitterTimelineEmbed
          sourceType="profile"
          screenName="projectslippi"
          theme="dark"
          noHeader={true}
          noFooter={true}
          transparent={true}
        />
      </TwitterFeedContainer>
      <AdvertContainer>
        <Advertisements />
      </AdvertContainer>
    </Outer>
  );
};
