import Typography from "@mui/material/Typography";

import { ExternalLink as A } from "@/components/external_link";

import { SlippiUsagePolicyListMessages as Messages } from "./slippi_usage_policy_list.messages";
import styles from "./slippi_usage_policy_list.module.css";

export const SlippiUsagePolicyList = () => {
  return (
    <div>
      <Typography className={styles.sectionHeader}>{Messages.privacyPolicyAndTermsOfService()}</Typography>
      <Typography color="var(--text-secondary)">{Messages.clickTheLinksBelow()}</Typography>
      <div className={styles.policiesList}>
        <Typography color="var(--text-secondary)">●</Typography>
        <Typography color="var(--text-secondary)">
          <A className={styles.link} href="https://slippi.gg/privacy">
            {Messages.slippiPrivacyPolicy()}
          </A>
        </Typography>
        <Typography color="var(--text-secondary)">●</Typography>
        <Typography color="var(--text-secondary)">
          <A className={styles.link} href="https://slippi.gg/tos">
            {Messages.slippiTermsOfService()}
          </A>
        </Typography>
      </div>
    </div>
  );
};
