import React from "react";

import styled, { keyframes } from "styled-components";

import slippiLogo from "../styles/images/slippi-logo.svg";

const bounceAnimation = keyframes`
  0%       { bottom: 5px; }
  25%, 75% { bottom: 15px; }
  50%      { bottom: 20px; }
  100%     { bottom: 0; }
`;

export interface LoadingIndicatorProps {
  size?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = (props) => {
  const { size } = props;
  const Outer = styled.div`
    display: flex;
    position: relative;
    height: ${size};
    width: ${size};
    padding-top: 20px;
  `;

  const Logo = styled.div`
    background-image: url("${slippiLogo}");
    background-size: contain;
    background-repeat: no-repeat;
    animation: ${bounceAnimation} 1.2s infinite;
    position: absolute;
    height: ${size};
    width: ${size};
  `;

  return (
    <Outer>
      <Logo />
    </Outer>
  );
};

LoadingIndicator.defaultProps = {
  size: "80px",
};
