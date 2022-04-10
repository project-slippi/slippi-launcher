import setupBroadcastIpc from "@broadcast/setup";
import setupConsoleIpc from "@console/setup";
import type { DolphinManager } from "@dolphin/manager";
import setupDolphinIpc from "@dolphin/setup";
import setupReplaysIpc from "@replays/setup";
import setupSettingsIpc from "@settings/setup";

import setupMainIpc from "./setup";

export function installModules(): { dolphinManager: DolphinManager } {
  const { dolphinManager } = setupDolphinIpc();
  setupBroadcastIpc({ dolphinManager });
  setupReplaysIpc();
  setupSettingsIpc();
  setupConsoleIpc({ dolphinManager });
  setupMainIpc();
  return { dolphinManager };
}
