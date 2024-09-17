import type { BroadcastService } from "@broadcast/types";
import type { ConsoleService } from "@console/types";
import type { DolphinService } from "@dolphin/types";
import type { RemoteService } from "@remote/types";
import type { ReplayService } from "@replays/types";

import type { AuthService } from "./auth/types";
import type { NotificationService } from "./notification/types";
import type { SlippiBackendService } from "./slippi/types";

export type Services = {
  authService: AuthService;
  slippiBackendService: SlippiBackendService;
  dolphinService: DolphinService;
  broadcastService: BroadcastService;
  consoleService: ConsoleService;
  replayService: ReplayService;
  notificationService: NotificationService;
  remoteService: RemoteService;
};
