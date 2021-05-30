import React from "react";
import { TwitterTimelineEmbed } from "react-twitter-embed";
import styled from "styled-components";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Spinner } from "@/components/Spinner";

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
`;

const LoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export const TwitterFeed: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  return (
    <Outer style={{ overflow: isLoading ? "hidden" : "auto" }}>
      <LoadingIndicator style={{ display: isLoading ? "block" : "none" }}>
        <Spinner />
      </LoadingIndicator>
      <ErrorBoundary>
        <TwitterFeedContainer style={{ opacity: isLoading ? 0 : 1 }}>
          <TwitterTimelineEmbed
            sourceType="profile"
            screenName="projectslippi"
            theme="dark"
            noHeader={true}
            noFooter={true}
            transparent={true}
            onLoad={() => setIsLoading(false)}
          />
        </TwitterFeedContainer>
      </ErrorBoundary>
    </Outer>
  );
};
