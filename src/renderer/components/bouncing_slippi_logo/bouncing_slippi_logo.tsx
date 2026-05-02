import { clsx } from "clsx";
import React from "react";

import slippiLogo from "@/styles/images/slippi_logo.svg";

import styles from "./bouncing_slippi_logo.module.scss";

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
    <div className={styles.container}>
      <div
        className={clsx(styles.logo, {
          [styles.onlyBounce]: animationState === "ready",
          [styles.bouncePlusSpin]: animationState === "running",
        })}
        ref={ref}
        onMouseOver={onMouseOver}
        style={{ backgroundImage: `url("${slippiLogo}")` }}
      />
    </div>
  );
};
