/**
 * Multi-Account Service
 *
 * Manages multiple Firebase authentication sessions using Firebase's multi-app support.
 *
 * ## Firebase Persistence
 * Firebase automatically persists authentication state in IndexedDB (browser storage).
 * Each Firebase app instance (identified by name) gets its own IndexedDB database:
 * - firebaseLocalStorageDb:app-account-{uid}
 * This means accounts stay logged in across app restarts automatically.
 *
 * ## No Refresh Token Needed
 * Firebase's built-in IndexedDB persistence handles everything automatically.
 * We don't need to manually store refresh tokens - Firebase does it for us.
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

      // Migrate existing session from default Firebase app (if any)
      await this._migrateExistingSession();

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
      log.info("Multi-account service initialized");
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
   * Migrate existing session from default Firebase app to multi-account system
   * This is a one-time migration for users who were logged in before multi-account support
   *
   * Strategy: Keep using the [DEFAULT] Firebase app for the migrated account.
   * New accounts added later will use named apps (app-account-{uid}).
   */
  private async _migrateExistingSession(): Promise<void> {
    // Skip if we already have accounts (migration already done or user started fresh)
    if (this._accounts.length > 0) {
      log.info("Accounts already exist, skipping migration");
      return;
    }

    try {
      // Check if there's a default Firebase app with an active session
      let defaultApp: FirebaseApp | null = null;
      try {
        defaultApp = getApp("[DEFAULT]");
      } catch {
        // No default app exists, try to initialize it to check for persisted session
        defaultApp = initializeApp(firebaseConfig);
      }

      if (!defaultApp) {
        log.info("No default Firebase app found, skipping migration");
        return;
      }

      const defaultAuth = getAuth(defaultApp);

      // Wait for Firebase to restore auth state from IndexedDB
      const user = await new Promise<typeof defaultAuth.currentUser>((resolve) => {
        const unsubscribe = onAuthStateChanged(defaultAuth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      if (!user) {
        log.info("No existing session found in default app, skipping migration");
        return;
      }

      log.info(`Found existing session for user: ${user.displayName || user.uid}, migrating to multi-account system`);

      // Create stored account from existing user
      const migratedAccount: StoredAccount = {
        id: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        displayPicture: generateDisplayPicture(user.uid),
        lastActive: new Date(),
        useDefaultApp: true,
      };

      // Add to accounts list
      this._accounts.push(migratedAccount);
      this._activeAccountId = user.uid;

      // Store the default Firebase app and auth for this migrated account
      // We use the default app to preserve the existing session
      this._firebaseApps.set(user.uid, defaultApp);
      this._authInstances.set(user.uid, defaultAuth);

      // Save the migrated account
      await this._saveAccounts();

      log.info("Successfully migrated existing session to multi-account system");
      log.info("User session preserved - no re-authentication required!");
    } catch (err) {
      log.error("Failed to migrate existing session:", err);
      // Don't throw - this is a best-effort migration
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
      const app = this._getOrCreateFirebaseApp(account.id, account.useDefaultApp);
      const auth = getAuth(app);

      // Store auth instance
      this._authInstances.set(account.id, auth);

      // Wait for Firebase to check IndexedDB and restore auth state
      await new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          // Unsubscribe after first event (initial state loaded)
          unsubscribe();

          if (user) {
            log.info(`Session restored for account: ${account.displayName}`);
          } else {
            log.warn(`No active session for account ${account.id} - will need re-authentication`);
          }

          resolve();
        });
      });
    } catch (err) {
      log.error(`Failed to restore account ${account.id}:`, err);
    }
  }

  /**
   * Get or create a Firebase app instance for an account
   */
  private _getOrCreateFirebaseApp(accountId: string, useDefaultApp?: boolean): FirebaseApp {
    let app = this._firebaseApps.get(accountId);

    if (!app) {
      if (useDefaultApp) {
        app = initializeApp(firebaseConfig);
      } else {
        try {
          // Try to get existing app
          app = getApp(accountId);
        } catch {
          // App doesn't exist, create it
          app = initializeApp(firebaseConfig, accountId);
        }
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

    // Check if account already exists by email (before creating temp app)
    // This avoids IndexedDB persistence conflicts when re-authenticating
    const existingAccountByEmail = this._accounts.find((acc) => acc.email === email);

    if (existingAccountByEmail) {
      log.info("Account with that email already exists, re-authenticating...");

      // Get or create the Firebase app for this existing account
      const app = this._getOrCreateFirebaseApp(existingAccountByEmail.id, existingAccountByEmail.useDefaultApp);
      const auth = getAuth(app);
      this._authInstances.set(existingAccountByEmail.id, auth);

      try {
        // Re-authenticate using the existing account's Firebase app
        // This avoids persistence conflicts that can occur with temp apps
        await signInWithEmailAndPassword(auth, email, password);

        // Switch to this account
        this._activeAccountId = existingAccountByEmail.id;
        existingAccountByEmail.lastActive = new Date();
        await this._saveAccounts();

        log.info(`Successfully re-authenticated and switched to account: ${existingAccountByEmail.displayName}`);
        return existingAccountByEmail;
      } catch (err) {
        log.error(`Failed to re-authenticate existing account:`, err);
        throw err;
      }
    }

    // Account doesn't exist - create a temporary Firebase app for login
    const tempAppName = `temp-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      // Login to get user details
      const { user } = await signInWithEmailAndPassword(tempAuth, email, password);

      if (!user) {
        throw new Error("Login failed");
      }

      // Create stored account (we know it's new because we already checked by email)
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
      const app = this._getOrCreateFirebaseApp(user.uid, storedAccount.useDefaultApp);
      const auth = getAuth(app);
      this._authInstances.set(user.uid, auth);

      // Transfer session to permanent app
      // Note: We'll need to re-authenticate here since we can't transfer sessions directly
      await signInWithEmailAndPassword(auth, email, password);

      // Set as active account
      this._activeAccountId = user.uid;

      // Save to storage
      await this._saveAccounts();

      // Clean up temp app
      await deleteApp(tempApp);

      log.info(`Added and switched to account: ${storedAccount.displayName}`);

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

      log.info(`Switched to account: ${account.displayName}`);
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
      // Check if this is the default app before deleting
      const app = this._firebaseApps.get(accountId);
      const isDefaultApp = app && app.name === "[DEFAULT]";

      // Delete Firebase app (this will also clear IndexedDB persistence)
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

      // If we deleted the default app and no accounts remain, recreate it
      // This ensures password reset and other features still work
      if (isDefaultApp && this._accounts.length === 0) {
        if (getApps().length === 0) {
          initializeApp(firebaseConfig);
          log.info("Recreated default Firebase app after removing last account");
        }
      }

      // Save to storage
      await this._saveAccounts();

      log.info(`Removed account: ${removedAccount.displayName}`);
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
