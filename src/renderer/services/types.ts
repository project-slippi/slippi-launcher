import type { AuthService } from "./authService/types";
import type { SlippiBackendService } from "./slippiBackendService/types";

export type Services = {
  authService: AuthService;
  slippiBackendService: SlippiBackendService;
};
