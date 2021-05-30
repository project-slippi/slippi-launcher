import React from "react";
import styled from "styled-components";

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

    timeout = setTimeout(() => {
      setCurrent((current + 1) % adverts.length);
    }, interval);
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
