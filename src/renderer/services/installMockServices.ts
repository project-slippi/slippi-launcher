import { MockAuthClient } from "./authService/mockAuthClient";
import { MockSlippiBackendClient } from "./slippiBackendService/mockSlippiBackendClient";
import type { Services } from "./types";

export default function installMockServices(): Services {
  const authService = new MockAuthClient();
  const slippiBackendService = new MockSlippiBackendClient(authService);

  return {
    authService,
    slippiBackendService,

    // TODO: Mock these services
    broadcastService: window.electron.broadcast,
    consoleService: window.electron.console,
  };
}
