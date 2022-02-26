/* eslint-disable import/no-default-export */
import { AuthService } from "./auth_service/auth_service";
import type { Services } from "./types";

export default function installServices(): Services {
  const authService = new AuthService();

  return {
    authService,
  };
}
