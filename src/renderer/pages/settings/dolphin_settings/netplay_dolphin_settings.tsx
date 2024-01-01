import { DolphinLaunchType } from "@dolphin/types";

import { DolphinSettings } from "./dolphin_settings";

export const NetplayDolphinSettings = () => {
  return <DolphinSettings dolphinType={DolphinLaunchType.NETPLAY} />;
};
