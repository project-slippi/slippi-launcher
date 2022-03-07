import { MockAuthClient } from "./authService/mockAuthClient";
import type { Services } from "./types";

export default function installMockServices(): Services {
  const authService = new MockAuthClient();

  return {
    authService,
  };
}
