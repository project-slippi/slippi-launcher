import * as stylex from "@stylexjs/stylex";
import React from "react";

import slippiLogo from "@/styles/images/slippi_logo.svg";

const bounceAnimation = stylex.keyframes({
  "0%": { bottom: "0px" },
  "100%": { bottom: "25px" },
});

const barrelRollAnimation = stylex.keyframes({
  "0%": { transform: "rotate(0)" },
  "100%": { transform: "rotate(720deg)" },
});

const styles = stylex.create({
  container: {
    display: "flex",
    position: "relative",
    paddingTop: "20px",
    height: "80px",
    width: "80px",
  },
  logo: {
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    position: "absolute",
    height: "60px",
    width: "80px",
  },
  onlyBounce: {
    animation: `${bounceAnimation} 0.6s infinite alternate`,
  },
  bouncePlusSpin: {
    animation: `${bounceAnimation} 0.6s infinite alternate, ${barrelRollAnimation} 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) alternate forwards`,
  },
});

export const BouncingSlippiLogo = () => {
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
    <div {...stylex.props(styles.container)}>
      <div
        {...stylex.props(styles.logo, animationState === "ready" ? styles.onlyBounce : styles.bouncePlusSpin)}
        ref={ref}
        onMouseOver={onMouseOver}
        style={{
          backgroundImage: `url("${slippiLogo}")`,
        }}
      />
    </div>
  );
};
