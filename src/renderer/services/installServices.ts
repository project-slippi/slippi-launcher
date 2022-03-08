/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import { AuthClient } from "./authService/authClient";
import { SlippiBackendClient } from "./slippiBackendService/slippiBackendClient";
import type { Services } from "./types";

const isDevelopment = window.electron.common.isDevelopment;

export default function installServices(): Services {
  const authService = new AuthClient();
  const slippiBackendUrl = process.env.SLIPPI_GRAPHQL_ENDPOINT;
  if (!slippiBackendUrl) {
    throw new Error("process.env.SLIPPI_GRAPHQL_ENDPOINT is not defined!");
  }

  const slippiBackendService = new SlippiBackendClient({
    authService,
    slippiBackendUrl,
    clientVersion: `${appVersion}${isDevelopment ? "-dev" : ""}`,
  });

  return {
    authService,
    slippiBackendService,
  };
}
