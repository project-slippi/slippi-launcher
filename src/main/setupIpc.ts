import installBroadcastIpc from "@broadcast/install";
import installConsoleIpc from "@console/install";
import installDolphinIpc from "@dolphin/install";
import type { DolphinManager } from "@dolphin/manager";
import installReplaysIpc from "@replays/install";
import installSettingsIpc from "@settings/install";

import installMainIpc from "./install";

export function setupIpc(): { dolphinManager: DolphinManager } {
  const { dolphinManager } = installDolphinIpc();
  installBroadcastIpc({ dolphinManager });
  installReplaysIpc();
  installSettingsIpc();
  installConsoleIpc({ dolphinManager });
  installMainIpc();
  return { dolphinManager };
}
