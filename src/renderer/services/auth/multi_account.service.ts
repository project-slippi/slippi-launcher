/**
 * Multi-Account Service
 *
 * Manages multiple Firebase authentication sessions using Firebase's multi-app support.
 *
 * ## Firebase Persistence
 * Firebase automatically persists authentication state in IndexedDB (browser storage).
 * Each Firebase app instance (identified by name) gets its own IndexedDB database.
 * This means accounts stay logged in across app restarts automatically.
 *
 * ## Refresh Token Storage
 * We also store refresh tokens (encrypted) in electron-settings as a backup.
 * However, Firebase's IndexedDB persistence is the primary mechanism.
 * The refresh tokens are extracted from Firebase's internal API (stsTokenManager)
 * which is not officially documented and may change in future versions.
 *
 * ## Account Switching
 * When switching accounts, we simply change which Firebase app instance is "active"
 * and notify listeners. All accounts remain logged in simultaneously.
 */

import type { AccountData, StoredAccount } from "@settings/types";
import log from "electron-log";
import type { FirebaseApp } from "firebase/app";
import { deleteApp, getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import { tokenStorage } from "./token_storage";
import type { MultiAccountService } from "./types";
import { SessionExpiredError } from "./types";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const MAX_ACCOUNTS = 5;

class MultiAccountClient implements MultiAccountService {
  private _accountsSubject = new Subject<{ accounts: StoredAccount[]; activeId: string | null }>();
  private _onAccountsChanged = multicast(this._accountsSubject);
  private _firebaseApps = new Map<string, FirebaseApp>();
  private _authInstances = new Map<string, Auth>();
  private _activeAccountId: string | null = null;
  private _accounts: StoredAccount[] = [];
  private _initialized = false;

  /**
   * Initialize the multi-account service and restore previous sessions
   */
  public async init(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // Load stored accounts
      await this._loadStoredAccounts();

      // Notify listeners of initial accounts state
      this._notifyAccountsChanged();

      // If we have accounts, restore their sessions
      if (this._activeAccountId && this._accounts.length > 0) {
        const activeAccount = this._accounts.find((acc) => acc.id === this._activeAccountId);
        if (activeAccount) {
          await this._restoreAccount(activeAccount);
        }
      }

      // Initialize default Firebase app if none exist
      if (getApps().length === 0) {
        initializeApp(firebaseConfig);
      }

      this._initialized = true;
    } catch (err) {
      log.error("Failed to initialize multi-account service:", err);
      this._initialized = true;
    }
  }

  /**
   * Load stored accounts from settings
   */
  private async _loadStoredAccounts(): Promise<void> {
    try {
      const settings = window.electron.settings.getAppSettingsSync();
      const accountData = settings.accounts;

      if (accountData) {
        this._activeAccountId = accountData.activeId;
        this._accounts = accountData.list.map((acc) => ({
          ...acc,
          lastActive: new Date(acc.lastActive),
        }));
      }

      log.info(`Loaded ${this._accounts.length} stored accounts`);
    } catch (err) {
      log.error("Failed to load stored accounts:", err);
      this._accounts = [];
      this._activeAccountId = null;
    }
  }

  /**
   * Save accounts to settings
   */
  private async _saveAccounts(): Promise<void> {
    try {
      const accountData: AccountData = {
        activeId: this._activeAccountId,
        list: this._accounts,
      };

      await window.electron.settings.updateSettings([{ key: "accounts", value: accountData }]);

      // Notify listeners of accounts change
      this._notifyAccountsChanged();
    } catch (err) {
      log.error("Failed to save accounts:", err);
      throw err;
    }
  }

  /**
   * Notify listeners that accounts have changed
   */
  private _notifyAccountsChanged(): void {
    this._accountsSubject.next({
      accounts: [...this._accounts],
      activeId: this._activeAccountId,
    });
  }

  /**
   * Restore a Firebase session for an account using stored refresh token
   */
  private async _restoreAccount(account: StoredAccount): Promise<void> {
    try {
      // Create or get Firebase app for this account
      const app = this._getOrCreateFirebaseApp(account.id);
      const auth = getAuth(app);

      // Store auth instance
      this._authInstances.set(account.id, auth);

      // Set up auth state listener (for persistence)
      onAuthStateChanged(auth, () => {
        // Auth state changes are handled by AuthService
      });

      // Check if user is already logged in (Firebase persists auth in IndexedDB)
      if (auth.currentUser) {
        log.info(`Session already active for account: ${account.email}`);
        return;
      }

      // Try to get stored refresh token (note: this may not work reliably)
      const refreshToken = await tokenStorage.getToken(account.id);

      if (refreshToken) {
        // We can't easily use refresh tokens with Firebase client SDK
        // Firebase handles persistence automatically via IndexedDB
        // The refresh token storage is mainly for backup/debugging
        log.info(`Found refresh token for account: ${account.email}`);
      } else {
        log.warn(`No refresh token found for account ${account.id} - may need re-authentication`);
      }

      log.info(`Restored auth instance for account: ${account.email}`);
    } catch (err) {
      log.error(`Failed to restore account ${account.id}:`, err);
    }
  }

  /**
   * Get or create a Firebase app instance for an account
   */
  private _getOrCreateFirebaseApp(accountId: string): FirebaseApp {
    let app = this._firebaseApps.get(accountId);

    if (!app) {
      try {
        // Try to get existing app
        app = getApp(accountId);
      } catch {
        // App doesn't exist, create it
        app = initializeApp(firebaseConfig, accountId);
      }

      this._firebaseApps.set(accountId, app);
    }

    return app;
  }

  /**
   * Add a new account
   */
  public async addAccount(email: string, password: string): Promise<StoredAccount> {
    // Check if we've hit the account limit
    if (this._accounts.length >= MAX_ACCOUNTS) {
      throw new Error(`Maximum of ${MAX_ACCOUNTS} accounts allowed`);
    }

    // Create a temporary Firebase app for login
    const tempAppName = `temp-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      // Login to get user details
      const { user } = await signInWithEmailAndPassword(tempAuth, email, password);

      if (!user) {
        throw new Error("Login failed");
      }

      // Check if account already exists
      const existingAccount = this._accounts.find((acc) => acc.id === user.uid);

      if (existingAccount) {
        // Account already added - auto-switch to it
        log.info(`Account ${email} already added, switching to it`);
        await deleteApp(tempApp);
        await this.switchAccount(user.uid);
        return existingAccount;
      }

      // Create stored account
      const storedAccount: StoredAccount = {
        id: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? "",
        displayPicture: generateDisplayPicture(user.uid),
        lastActive: new Date(),
      };

      // Add to accounts list
      this._accounts.push(storedAccount);

      // Create permanent Firebase app for this account
      const app = this._getOrCreateFirebaseApp(user.uid);
      const auth = getAuth(app);
      this._authInstances.set(user.uid, auth);

      // Transfer session to permanent app
      // Note: We'll need to re-authenticate here since we can't transfer sessions directly
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Store the refresh token
      // Firebase doesn't officially expose refresh tokens, but they're available in the internal structure
      // This accesses the internal API which may change in future Firebase versions
      const refreshToken = (result.user as any).stsTokenManager?.refreshToken;
      if (refreshToken) {
        await tokenStorage.storeToken(user.uid, refreshToken);
      } else {
        // Fallback: Firebase stores tokens in IndexedDB, but we can't easily access them
        // For now, log a warning - the user will need to re-authenticate on next launch
        log.warn(`Could not extract refresh token for account ${email}. Session may not persist.`);
      }

      // Set up auth state listener (for persistence)
      onAuthStateChanged(auth, () => {
        // Auth state changes are handled by AuthService
      });

      // Set as active account
      this._activeAccountId = user.uid;

      // Save to storage
      await this._saveAccounts();

      // Clean up temp app
      await deleteApp(tempApp);

      log.info(`Added and switched to account: ${email}`);

      return storedAccount;
    } catch (err) {
      // Clean up temp app on error
      await deleteApp(tempApp);
      log.error("Failed to add account:", err);
      throw err;
    }
  }

  /**
   * Switch to a different account
   */
  public async switchAccount(accountId: string): Promise<void> {
    const account = this._accounts.find((acc) => acc.id === accountId);

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // If already active, do nothing
    if (this._activeAccountId === accountId) {
      log.info("Account already active, no switch needed");
      return;
    }

    try {
      // Get or restore Firebase app for this account
      let auth = this._authInstances.get(accountId);

      if (!auth) {
        // Need to restore the account
        await this._restoreAccount(account);
        auth = this._authInstances.get(accountId);
      }

      if (!auth) {
        throw new Error("Failed to restore account authentication");
      }

      // Check if user is still logged in
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Session expired - throw special error with account info
        throw new SessionExpiredError(account.email, accountId);
      }

      // Update active account
      this._activeAccountId = accountId;

      // Update last active timestamp
      account.lastActive = new Date();

      // Save to storage
      await this._saveAccounts();

      log.info(`Switched to account: ${account.email}`);
    } catch (err) {
      log.error(`Failed to switch to account ${accountId}:`, err);
      throw err;
    }
  }

  /**
   * Remove an account
   */
  public async removeAccount(accountId: string): Promise<void> {
    const accountIndex = this._accounts.findIndex((acc) => acc.id === accountId);

    if (accountIndex === -1) {
      throw new Error(`Account ${accountId} not found`);
    }

    try {
      // Remove token
      await tokenStorage.removeToken(accountId);

      // Delete Firebase app
      const app = this._firebaseApps.get(accountId);
      if (app) {
        await deleteApp(app);
        this._firebaseApps.delete(accountId);
      }

      // Remove auth instance
      this._authInstances.delete(accountId);

      // Remove from accounts list
      const removedAccount = this._accounts[accountIndex];
      this._accounts.splice(accountIndex, 1);

      // If this was the active account, switch to another or clear
      if (this._activeAccountId === accountId) {
        if (this._accounts.length > 0) {
          // Switch to most recently active account
          const sortedAccounts = [...this._accounts].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
          await this.switchAccount(sortedAccounts[0].id);
        } else {
          // No accounts left
          this._activeAccountId = null;
        }
      }

      // Save to storage
      await this._saveAccounts();

      log.info(`Removed account: ${removedAccount.email}`);
    } catch (err) {
      log.error(`Failed to remove account ${accountId}:`, err);
      throw err;
    }
  }

  /**
   * Get all stored accounts
   */
  public getAccounts(): StoredAccount[] {
    // Return sorted by last active (most recent first)
    return [...this._accounts].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }

  /**
   * Get the active account ID
   */
  public getActiveAccountId(): string | null {
    return this._activeAccountId;
  }

  /**
   * Get the active Firebase Auth instance (for AuthService to use)
   */
  public getActiveAuth(): Auth | null {
    if (!this._activeAccountId) {
      return null;
    }

    return this._authInstances.get(this._activeAccountId) ?? null;
  }

  /**
   * Subscribe to accounts list changes
   */
  public onAccountsChange(
    onChange: (data: { accounts: StoredAccount[]; activeId: string | null }) => void,
  ): () => void {
    const subscription = this._onAccountsChanged.subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }
}

export function createMultiAccountService(): MultiAccountService {
  return new MultiAccountClient();
}
