export type AuthUser = {
  uid: string;
  displayName: string;
  displayPicture: string;
  email: string;
  emailVerified: boolean;
};

export class SessionExpiredError extends Error {
  constructor(public email: string, public accountId: string) {
    super(`Session expired for ${accountId}`);
    this.name = "SessionExpiredError";
  }
}

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
  getMultiAccountService(): MultiAccountService;
}

// Multi-account types
// Note: StoredAccount and AccountData are defined in @settings/types.ts
import type { StoredAccount } from "@settings/types";

export interface MultiAccountService {
  // Initialization
  init(): Promise<void>;

  // Account Management
  addAccount(email: string, password: string): Promise<StoredAccount>;
  removeAccount(accountId: string): Promise<void>;
  switchAccount(accountId: string): Promise<void>;
  getAccounts(): StoredAccount[];
  getActiveAccountId(): string | null;

  // Get the active Firebase Auth instance for AuthService to use
  getActiveAuth(): any | null; // Returns firebase Auth instance

  // Notifications
  onAccountsChange(onChange: (data: { accounts: StoredAccount[]; activeId: string | null }) => void): () => void;
}
