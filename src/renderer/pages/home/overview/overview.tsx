import React from "react";

import { NewsPreview } from "./news_preview";
import styles from "./overview.module.scss";
import { RankedStatus } from "./sidebar/ranked_status";

export const HomeOverview = React.memo(function HomeOverview() {
  return (
    <div className={styles.container}>
      <div className={styles.col1}>
        <NewsPreview />
      </div>
      <div className={styles.col2}>
        <Box>div 2</Box>
      </div>
      <div className={styles.col3Top}>
        <RankedStatus />
      </div>
      <div className={styles.col3Bottom}>
        <Box>div 4</Box>
      </div>
    </div>
  );
});

const Box = ({ children }: { children: React.ReactNode }) => {
  return <div style={{ height: "100%", width: "100%", backgroundColor: "gray" }}>{children}</div>;
};
