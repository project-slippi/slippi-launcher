export type AuthUser = {
  uid: string;
  displayName: string;
  displayPicture: string;
  email: string;
  emailVerified: boolean;
};

export interface AuthService {
  getCurrentUser(): AuthUser | null;
  getUserToken(): Promise<string>;
  init(): Promise<AuthUser | null>;
  login(args: { email: string; password: string }): Promise<AuthUser | null>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
  sendVerificationEmail(): Promise<void>;
  onUserChange(onChange: (user: AuthUser | null) => void): () => void;
  resetPassword(email: string): Promise<void>;
  signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | null>;
  updateDisplayName(displayName: string): Promise<void>;
  // Multi-account support
  getMultiAccountService?(): MultiAccountService | null;
}

// Multi-account types

export interface StoredAccount {
  id: string; // Firebase UID
  email: string;
  displayName: string;
  displayPicture: string;
  lastActive: Date;
}

export interface MultiAccountService {
  // Account Management
  addAccount(email: string, password: string): Promise<StoredAccount>;
  removeAccount(accountId: string): Promise<void>;
  switchAccount(accountId: string): Promise<void>;
  getAccounts(): StoredAccount[];
  getActiveAccountId(): string | null;

  // Auth Operations (delegates to active account)
  getCurrentUser(): AuthUser | null;
  getUserToken(): Promise<string>;
  init(): Promise<AuthUser | null>;
  logout(): Promise<void>; // Active account only
  onUserChange(onChange: (user: AuthUser | null) => void): () => void;
}
