/* eslint-disable import/no-default-export */
import { MockAuthService } from "./auth_service/auth_service.mock";
import type { Services } from "./types";

export default function installMockServices(): Services {
  const authService = new MockAuthService();

  return {
    authService,
  };
}
