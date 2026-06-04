import Typography from "@mui/material/Typography";

import { SlippiOnlineRulesMessages as Messages } from "./slippi_online_rules.messages";
import styles from "./slippi_online_rules.module.css";

export const SlippiOnlineRules = () => {
  return (
    <div>
      <Typography className={styles.sectionHeader}>{Messages.slippiOnlineRules()}</Typography>
      <div className={styles.rulesContainer}>
        <Typography>{Messages.slippiOnlineRulesDescription()}</Typography>
        <div className={styles.rulesList}>
          <Typography>1.</Typography>
          <Typography>{Messages.rule1()}</Typography>
          <Typography>2.</Typography>
          <Typography>{Messages.rule2()}</Typography>
          <Typography>3.</Typography>
          <Typography>{Messages.rule3()}</Typography>
          <Typography>4.</Typography>
          <Typography>{Messages.rule4()}</Typography>
        </div>
      </div>
    </div>
  );
};
