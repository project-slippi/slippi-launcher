import styled from "@emotion/styled";
import { socials } from "common/constants";
import React from "react";

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
  overflow: hidden;
`;

export const TwitterFeed: React.FC = () => {
  const params = new URLSearchParams({
    screenName: socials.twitterId,
    theme: "dark",
    noHeader: "true",
    noFooter: "true",
    transparent: "true",
  });
  return (
    <Outer>
      <TwitterFeedContainer>
        <iframe
          sandbox="allow-scripts allow-same-origin allow-popups"
          src={`https://vinceau.github.io/twitter-embed/?${params.toString()}`}
          height="100%"
          width="100%"
          frameBorder="none"
        />
      </TwitterFeedContainer>
    </Outer>
  );
};
