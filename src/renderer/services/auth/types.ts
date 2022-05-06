export type AuthUser = {
  uid: string;
  displayName: string;
  displayPicture: string;
};

export interface AuthService {
  getCurrentUser(): AuthUser | null;
  getUserToken(): Promise<string>;
  init(): Promise<AuthUser | null>;
  login(args: { email: string; password: string }): Promise<AuthUser | null>;
  logout(): Promise<void>;
  onUserChange(onChange: (user: AuthUser | null) => void): () => void;
  resetPassword(email: string): Promise<void>;
  signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | null>;
  updateDisplayName(displayName: string): Promise<void>;
}
