/* eslint-disable import/no-default-export */
import { AuthClient } from "./authService/authClient";
import type { Services } from "./types";

export default function installServices(): Services {
  const authService = new AuthClient();

  return {
    authService,
  };
}
