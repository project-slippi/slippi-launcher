import React from "react";
import styled from "@emotion/styled";

import { ExternalLink } from "@/components/ExternalLink";

import { Advert } from "./Advert";
import { AdInfo } from "./types";

export const RotatingAd: React.FC<{
  interval?: number;
  adverts: AdInfo[];
}> = ({ adverts, interval = 0 }) => {
  const [current, setCurrent] = React.useState(0);
  let timeout: number | null = null;

  const stopRotation = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  };

  const startRotation = () => {
    if (interval <= 0) {
      return;
    }

    // Stop any existing intervals
    stopRotation();

    // I'm pretty sure setTimeout returns a number but for some reason the types
    // are getting mixed up with NodeJS.Timeout so I guess we'll just convert it
    // into an unknown number for now.
    timeout = (setTimeout(() => {
      setCurrent((current + 1) % adverts.length);
    }, interval) as unknown) as number;
  };

  // Auto start rotation on render
  React.useEffect(() => {
    startRotation();
    return () => {
      stopRotation();
    };
  });

  const advert = adverts[current];
  return (
    <Container href={advert.url} onMouseEnter={stopRotation} onMouseLeave={startRotation}>
      <Advert info={advert} />
    </Container>
  );
};

const Container = styled(ExternalLink)`
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
  text-decoration: none;
  color: inherit;
  display: inline-block;
  height: 100%;
  width: 100%;

  &:hover {
    opacity: 0.8;
  }
`;
