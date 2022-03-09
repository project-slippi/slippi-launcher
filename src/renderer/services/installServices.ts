/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import { AuthClient } from "./authService/authClient";
import { SlippiBackendClient } from "./slippiBackendService/slippiBackendClient";
import type { Services } from "./types";

const isDevelopment = window.electron.common.isDevelopment;

export default function installServices(): Services {
  const authService = new AuthClient();
  const slippiBackendService = new SlippiBackendClient({
    authService,
    clientVersion: `${appVersion}${isDevelopment ? "-dev" : ""}`,
  });

  return {
    authService,
    slippiBackendService,
  };
}
