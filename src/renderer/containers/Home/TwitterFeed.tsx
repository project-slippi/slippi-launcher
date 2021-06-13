import styled from "@emotion/styled";
import { socials } from "common/constants";
import React from "react";

const TwitterFeedContainer = styled.div`
  transition: opacity 1s ease-in-out;
  & > div {
    height: 100%;
    width: 100%;
  }
`;

const Outer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`;

export const TwitterFeed: React.FC = () => {
  return (
    <Outer>
      <TwitterFeedContainer style={{ height: "100%" }}>
        <iframe
          sandbox="allow-scripts allow-same-origin allow-popups"
          src={`https://vinceau.github.io/twitter-embed/?screenName=${socials.twitterId}&theme=dark&transparent=true`}
          height="100%"
          width="100%"
          frameBorder="none"
        />
      </TwitterFeedContainer>
    </Outer>
  );
};
