import CircularProgress from "@mui/material/CircularProgress";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { UserIcon } from "@/components/user_icon";
import { colors } from "@/styles/tokens.stylex";

const styles = stylex.create({
  container: {
    display: "flex",
    alignItems: "center",
    color: "white",
    minWidth: {
      "@media (min-width: 800px)": 250,
    },
  },
  userDetails: {
    display: {
      default: "flex",
      "@media (max-width: 800px)": "none",
    },
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: 10,
  },
  displayName: {
    margin: 0,
    marginBottom: 6,
    fontSize: 18,
  },
  subText: {
    fontWeight: "bold",
    fontSize: 14,
    color: colors.purpleLight,
  },
  errorText: {
    color: "red",
  },
});

export const UserInfo = React.memo(function UserInfo({
  displayName,
  displayPicture,
  connectCode,
  errorMessage,
  loading,
}: {
  displayName: string;
  displayPicture: string;
  connectCode?: string;
  errorMessage?: string;
  loading?: boolean;
}) {
  const subtext = errorMessage ? errorMessage : connectCode || "";

  return (
    <div {...stylex.props(styles.container)}>
      {loading ? <CircularProgress color="inherit" /> : <UserIcon imageUrl={displayPicture} size={38} />}
      <div {...stylex.props(styles.userDetails)}>
        <h3 {...stylex.props(styles.displayName)}>{displayName}</h3>
        {!loading && <div {...stylex.props(styles.subText, errorMessage != null && styles.errorText)}>{subtext}</div>}
      </div>
    </div>
  );
});
