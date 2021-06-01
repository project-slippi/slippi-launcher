import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import slippiLogo from "../styles/images/slippi-logo.svg";

const bounceAnimation = keyframes`
  0%       { bottom: 5px; }
  25%, 75% { bottom: 15px; }
  50%      { bottom: 20px; }
  100%     { bottom: 0; }
`;

const Outer = styled.div<{
  size: string;
}>`
  display: flex;
  position: relative;
  height: ${(props) => props.size};
  width: ${(props) => props.size};
  padding-top: 20px;
`;

const Logo = styled.div<{
  size: string;
}>`
  background-image: url("${slippiLogo}");
  background-size: contain;
  background-repeat: no-repeat;
  animation: ${bounceAnimation} 1.2s infinite;
  position: absolute;
  height: ${(props) => props.size};
  width: ${(props) => props.size};
`;

export interface BouncingSlippiLogoProps {
  size?: string;
}

export const BouncingSlippiLogo: React.FC<BouncingSlippiLogoProps> = ({ size = "80px" }) => {
  return (
    <Outer size={size}>
      <Logo size={size} />
    </Outer>
  );
};
