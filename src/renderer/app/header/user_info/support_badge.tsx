import { clsx } from "clsx";
import React from "react";

import styles from "./support_badge.module.css";

export function SupportBadge({ tier, isVip }: { tier: "TIER1" | "TIER2" | "TIER3"; isVip?: boolean }) {
  const { color, text } = React.useMemo(() => {
    let color = "";
    let text = "";
    if (isVip) {
      color = "#2F80ED";
      text = "VIP";
    } else if (tier === "TIER1") {
      text = "Tier 1";
    } else if (tier === "TIER2") {
      color = "#27AE60";
      text = "Tier 2";
    } else if (tier === "TIER3") {
      color = "#9B51E0";
      text = "Tier 3";
    }
    return { color, text };
  }, [tier, isVip]);

  // Show a border since TIER1 doesn't have a color associated
  const showBorder = tier === "TIER1" && !isVip;

  return (
    <div className={clsx(styles.tierBadge, showBorder && styles.border)} style={{ background: color }}>
      {text}
    </div>
  );
}
