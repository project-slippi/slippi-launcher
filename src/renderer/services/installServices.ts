import { AuthService } from "./auth_service/auth_service";
import type { IAuthService } from "./auth_service/types";

export type Services = {
  authService: IAuthService;
};

export const installServices = (): Services => {
  const authService = new AuthService();

  return {
    authService,
  };
};
