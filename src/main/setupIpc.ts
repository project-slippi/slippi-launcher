import installBroadcastIpc from "@broadcast/install";
import installConsoleIpc from "@console/install";
import installDolphinIpc from "@dolphin/install";
import installReplaysIpc from "@replays/install";
import installSettingsIpc from "@settings/install";

import installMainIpc from "./install";

export function setupIpc() {
  installBroadcastIpc();
  installDolphinIpc();
  installReplaysIpc();
  installSettingsIpc();
  installConsoleIpc();
  installMainIpc();
}
