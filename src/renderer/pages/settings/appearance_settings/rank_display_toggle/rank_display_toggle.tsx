import React from "react";

import { Toggle } from "@/components/form/toggle";
import { useEnableRankDisplay } from "@/lib/hooks/use_settings";

import { SettingItem } from "../../setting_item_section";
import { RankDisplayToggleMessages as Messages } from "./rank_display_toggle.messages";
export const RankDisplayToggle = React.memo(() => {
  const [enableRankDisplay, setEnableRankDisplay] = useEnableRankDisplay();

  return (
    <SettingItem name="">
      <Toggle
        value={enableRankDisplay}
        onChange={(checked) => setEnableRankDisplay(checked)}
        label={Messages.rankDisplay()}
        description={Messages.rankDisplayDescription()}
        disabled={false}
      />
    </SettingItem>
  );
});
