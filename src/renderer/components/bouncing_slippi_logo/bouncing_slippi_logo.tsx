import { css, keyframes } from "@emotion/react";
import React from "react";

import slippiLogo from "@/styles/images/slippi-logo.svg";

const bounceAnimation = keyframes`
  0%  { bottom: 0px; }
  100%  { bottom: 25px; }
`;

const barrelRollAnimation = keyframes`
  0%   { transform: rotate(0); }
  100% { transform: rotate(720deg); }
`;

const onlyBounce = css`
  animation: ${bounceAnimation} 0.6s infinite alternate;
`;

const bouncePlusSpin = css`
  animation: ${bounceAnimation} 0.6s infinite alternate,
    ${barrelRollAnimation} 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) alternate forwards;
`;

export const BouncingSlippiLogo = ({ size = "80px" }: { size?: string }) => {
  const ref = React.createRef<HTMLDivElement>();
  const [animationState, setAnimationState] = React.useState<"running" | "ready">("ready");

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const el = ref.current;
    const onAnimationEnd = () => setAnimationState("ready");
    el.addEventListener("animationend", onAnimationEnd, false);
    return () => {
      el.removeEventListener("animationend", onAnimationEnd);
    };
  }, [ref, animationState]);

  const onMouseOver = React.useCallback(() => {
    if (animationState === "ready") {
      setAnimationState("running");
    }
  }, [animationState, setAnimationState]);

  return (
    <div
      css={css`
        display: flex;
        position: relative;
        padding-top: 20px;
        height: ${size};
        width: ${size};
      `}
    >
      <div
        css={css`
          background-image: url("${slippiLogo}");
          background-size: contain;
          background-repeat: no-repeat;
          ${animationState === "ready" ? onlyBounce : bouncePlusSpin}
          position: absolute;
          height: calc(${size}*0.75);
          width: ${size};
        `}
        ref={ref}
        onMouseOver={onMouseOver}
      />
    </div>
  );
};
