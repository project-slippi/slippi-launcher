import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { format } from "date-fns";

import { Checkbox } from "@/components/form/checkbox";
import { Toggle } from "@/components/form/toggle";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useEnableMonthlySubfolders, useEnableNetplayReplays } from "@/lib/hooks/use_settings";

import { SettingItem } from "../setting_item_section";
import { ReplaySettingsMessages as Messages } from "./replay_settings.messages";

export const NetplayReplayToggles = () => {
  const [enableNetplayReplays, setEnableNetplayReplays] = useEnableNetplayReplays();
  const [enableMonthlySubfolders, setEnableMonthlySubfolders] = useEnableMonthlySubfolders();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);
  const currentDate = format(new Date(), "yyyy-MM");

  const onEnableNetplayReplaysToggle = async (checked: boolean) => {
    await setEnableNetplayReplays(checked);
  };

  const onEnableMonthlySubfoldersToggle = async () => {
    await setEnableMonthlySubfolders(!enableMonthlySubfolders);
  };

  return (
    <SettingItem name="">
      <Toggle
        value={enableNetplayReplays}
        onChange={(checked) => onEnableNetplayReplaysToggle(checked)}
        label={Messages.enableNetplayReplays()}
        description={Messages.enableNetplayReplaysDescription()}
        disabled={netplayDolphinOpen}
      />
      <Checkbox
        css={css`
          margin-top: 5px;
        `}
        onChange={() => onEnableMonthlySubfoldersToggle()}
        checked={enableMonthlySubfolders}
        disabled={netplayDolphinOpen || !enableNetplayReplays}
        hoverText={netplayDolphinOpen ? Messages.closeDolphinToChangeSetting() : ""}
        label={<CheckboxDescription>{Messages.saveReplaysToMonthlySubfolders(currentDate)}</CheckboxDescription>}
      />
    </SettingItem>
  );
};

const CheckboxDescription = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;
