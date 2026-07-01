import { css } from "@emotion/react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";

import { AutoRefreshCountdown } from "./auto_refresh_countdown";
import { AutoRefreshMessages as Messages } from "./auto_refresh_toggle.messages";
import styles from "./auto_refresh_toggle.module.css";
import { useAutoRefresh } from "./use_auto_refresh";

export function AutoRefreshToggle({ onRefreshBroadcasts }: { onRefreshBroadcasts: () => void }) {
  const { enabled, expiresAt, toggle, extend } = useAutoRefresh(onRefreshBroadcasts);
  return (
    <div className={styles.autoRefreshControl}>
      <FormControlLabel
        labelPlacement="start"
        control={<Switch checked={enabled} onChange={toggle} color="primary" size="small" />}
        label={Messages.autoRefresh()}
        sx={{ margin: 0 }}
        css={css`
          .MuiFormControlLabel-label {
            font-size: 12px;
            margin-right: 8px;
          }
        `}
      />
      {enabled && (
        <Tooltip title={Messages.clickToExtend()}>
          <span className={styles.timer} onClick={extend}>
            <AutoRefreshCountdown expiresAt={expiresAt} />
          </span>
        </Tooltip>
      )}
    </div>
  );
}
