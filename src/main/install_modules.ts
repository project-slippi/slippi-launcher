import setupBroadcastIpc from "@broadcast/setup";
import setupConsoleIpc from "@console/setup";
import { DolphinManager } from "@dolphin/manager";
import setupDolphinIpc from "@dolphin/setup";
import setupRemoteIpc from "@remote/setup";
import setupReplaysIpc from "@replays/setup";
import { SettingsManager } from "@settings/settings_manager";
import setupSettingsIpc from "@settings/setup";

import type { ConfigFlags } from "./flags/flags";
import setupMainIpc from "./setup";

export function installModules(flags: ConfigFlags) {
  const settingsManager = new SettingsManager();
  const dolphinManager = new DolphinManager(settingsManager);
  setupDolphinIpc({ dolphinManager });
  setupBroadcastIpc({ settingsManager, dolphinManager });
  setupReplaysIpc({ enableReplayDatabase: flags.enableReplayDatabase });
  setupSettingsIpc({ settingsManager, dolphinManager });
  setupConsoleIpc({ dolphinManager });
  setupRemoteIpc({ dolphinManager, settingsManager });
  setupMainIpc({ dolphinManager, flags });
  return { dolphinManager, settingsManager };
}
