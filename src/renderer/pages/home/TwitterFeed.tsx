import { socials } from "@common/constants";
import styled from "@emotion/styled";
import React from "react";
import { TwitterTimelineEmbed } from "react-twitter-embed";

const TwitterFeedContainer = styled.div`
  transition: opacity 1s ease-in-out;
  height: 100%;
  & > div {
    height: 100%;
    width: 100%;
  }
`;

const Outer = styled.div`
  position: relative;
  flex: 1;
  overflow-x: hidden;
`;

export const TwitterFeed = React.memo(function TwitterFeed() {
  const params = {
    screenName: socials.twitterId,
    theme: "dark",
    noHeader: true,
    noFooter: true,
    transparent: true,
  };
  return (
    <Outer>
      <TwitterFeedContainer>
        <TwitterTimelineEmbed sourceType="profile" {...params} />
      </TwitterFeedContainer>
    </Outer>
  );
});
