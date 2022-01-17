import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import React, { useCallback } from "react";

import slippiLogo from "../styles/images/slippi-logo.svg";

const bounceAnimation = keyframes`
  0%       { bottom: 5px; }
  25%, 75% { bottom: 15px; }
  50%      { bottom: 20px; }
  100%     { bottom: 0; }
`;

const barrelRollAnimation = keyframes`
  0%   { transform: rotate(0); }
  100% { transform: rotate(720deg); }
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

// logo is proportionally smaller to size by a factor of 0.75
// so we need to scale it down to avoid pivotal animations
const Logo = styled.div<{
  size: string;
  rollAnimationState: "running" | "paused";
}>`
  background-image: url("${slippiLogo}");
  background-size: contain;
  background-repeat: no-repeat;
  animation: ${bounceAnimation} 1.2s infinite forwards,
    ${barrelRollAnimation} 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) alternate forwards;
  animation-play-state: running, ${(props) => props.rollAnimationState};
  position: absolute;
  height: calc(${(props) => props.size}*0.75);
  width: ${(props) => props.size};
`;

export interface BouncingSlippiLogoProps {
  size?: string;
}

export const BouncingSlippiLogo: React.FC<BouncingSlippiLogoProps> = ({ size = "80px" }) => {
  const [roll, setRoll] = React.useState(false);

  const onMouseOver = useCallback(() => {
    if (!roll) {
      setRoll(true);
    }
  }, [roll]);

  return (
    <Outer size={size}>
      <Logo size={size} rollAnimationState={roll ? "running" : "paused"} onMouseOver={onMouseOver} />
    </Outer>
  );
};
