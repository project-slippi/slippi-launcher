/* eslint-disable import/no-default-export */
import { AuthClient } from "./authService/authClient";
import { SlippiBackendClient } from "./slippiBackendService/slippiBackendClient";
import type { Services } from "./types";

export default function installServices(): Services {
  const authService = new AuthClient();
  const slippiBackendService = new SlippiBackendClient(authService);

  return {
    authService,
    slippiBackendService,
  };
}
