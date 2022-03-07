export type AuthUser = {
  uid: string;
  displayName: string;
};

export interface AuthService {
  init(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  onUserChange(onChange: (user: AuthUser | null) => void): () => void;
  resetPassword(email: string): Promise<void>;
  login(args: { email: string; password: string }): Promise<AuthUser | null>;
  signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | null>;
}
