import { DolphinLaunchType } from "@dolphin/types";

import { DolphinSettings } from "./dolphin_settings";

export const PlaybackDolphinSettings = () => {
  return <DolphinSettings dolphinType={DolphinLaunchType.PLAYBACK} />;
};
