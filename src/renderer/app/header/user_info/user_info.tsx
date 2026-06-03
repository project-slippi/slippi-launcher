import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import { clsx } from "clsx";
import React from "react";

import { UserIcon } from "@/components/user_icon";

import { SupportBadge } from "./support_badge";
import styles from "./user_info.module.css";

export const UserInfo = React.memo(function UserInfo({
  displayName,
  displayPicture,
  connectCode,
  errorMessage,
  tier = "NONE",
  isVip,
  loading,
}: {
  displayName: string;
  displayPicture: string;
  tier?: "TIER1" | "TIER2" | "TIER3" | "NONE";
  isVip?: boolean;
  connectCode?: string;
  errorMessage?: string;
  loading?: boolean;
}) {
  return (
    <div className={styles.root}>
      {loading ? <CircularProgress color="inherit" /> : <UserIcon imageUrl={displayPicture} size={42} />}
      <div className={styles.content}>
        <h3 className={styles.displayName}>{displayName}</h3>
        {!loading &&
          (errorMessage ? (
            <div className={clsx(styles.subtitle, styles.error)}>{errorMessage}</div>
          ) : (
            <div className={styles.subtitle}>
              <span>{connectCode}</span>
              {tier !== "NONE" && <SupportBadge tier={tier} isVip={isVip} />}
            </div>
          ))}
      </div>
      <div className={styles.expandMoreIcon}>
        <ExpandMoreIcon />
      </div>
    </div>
  );
});
