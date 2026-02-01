import type { StoredAccount } from "@settings/types";
import log from "electron-log";
import type { Auth } from "firebase/auth";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import type { AuthUser, MultiAccountService } from "./types";
import { SessionExpiredError } from "./types";

type MockAuth = {
  currentUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
    emailVerified: boolean;
    reload: () => Promise<void>;
  };
};

const MAX_ACCOUNTS = 5;

const testUsers = [
  {
    email: "test",
    password: "test",
    displayName: "Test User",
    emailVerified: true,
  },
  {
    email: "admin",
    password: "admin",
    displayName: "Admin User",
    emailVerified: true,
  },
];

class MockMultiAccountClient implements MultiAccountService {
  private _accountsSubject = new Subject<{ accounts: StoredAccount[]; activeId: string | null }>();
  private _onAccountsChanged = multicast(this._accountsSubject);
  private _authInstances = new Map<string, Auth>();
  private _activeAccountId: string | null = null;
  private _accounts: StoredAccount[] = [];
  private _initialized = false;
  private _usersMap = new Map<string, AuthUser>();

  constructor() {
    // Add our fake user
    for (const user of testUsers) {
      const fakeUser = generateFakeUser({
        uid: user.email,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      });

      this._usersMap.set(this._hashEmailPassword(user.email, user.password), fakeUser);
    }
  }

  public async init(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      this._notifyAccountsChanged();

      this._initialized = true;
      log.info("Multi-account service initialized");
    } catch (err) {
      log.error("Failed to initialize multi-account service:", err);
      this._initialized = true;
    }
  }

  public async signUp(email: string, password: string, displayName: string): Promise<StoredAccount> {
    try {
      const uid = email + displayName;
      const newUser = generateFakeUser({
        email,
        uid,
        displayName,
      });
      this._usersMap.set(this._hashEmailPassword(email, password), newUser);

      return await this.addAccount(email, password);
    } catch (err) {
      log.error("Failed to sign up new user:", err);
      throw err;
    }
  }

  private _hashEmailPassword(email: string, password: string): string {
    return `email:${email}+password:${password}`;
  }

  private _notifyAccountsChanged(): void {
    this._accountsSubject.next({
      accounts: [...this._accounts],
      activeId: this._activeAccountId,
    });
  }

  public async addAccount(email: string, password: string): Promise<StoredAccount> {
    if (this._accounts.length >= MAX_ACCOUNTS) {
      throw new Error(`Maximum of ${MAX_ACCOUNTS} accounts allowed`);
    }
    const existingAccountByEmail = this._accounts.find((acc) => acc.email === email);

    if (existingAccountByEmail) {
      log.info("Account with that email already exists, re-authenticating...");
      try {
        await this._signInWithStoredAccount(existingAccountByEmail);
        log.info(`Successfully re-authenticated and switched to account: ${existingAccountByEmail.displayName}`);
        return existingAccountByEmail;
      } catch (err) {
        log.error(`Failed to re-authenticate existing account:`, err);
        throw err;
      }
    }

    const hash = this._hashEmailPassword(email, password);
    const user = this._usersMap.get(hash);
    if (!user) {
      throw new Error(`Invalid username or password. Try '${testUsers[0].email}' and '${testUsers[0].password}' or
        '${testUsers[1].email}' and '${testUsers[1].password}'.`);
    }
    const mockAuth: MockAuth = {
      currentUser: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        reload: async () => {},
      },
    };

    try {
      const storedAccount = mapUserToStoredAccount(user, email);
      this._authInstances.set(storedAccount.id, mockAuth as unknown as Auth);

      await this._signInWithStoredAccount(storedAccount);

      log.info(`Added and switched to account: ${storedAccount.displayName}`);

      return storedAccount;
    } catch (err) {
      log.error("Failed to add account:", err);
      throw err;
    }
  }

  private async _signInWithStoredAccount(account: StoredAccount): Promise<void> {
    this._activeAccountId = account.id;
    account.lastActive = new Date();

    if (!this._accounts.some((acc) => acc.id === this._activeAccountId)) {
      this._accounts.push(account);
    }
    this._notifyAccountsChanged();
  }

  public async switchAccount(accountId: string): Promise<void> {
    const account = this._accounts.find((acc) => acc.id === accountId);

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (this._activeAccountId === accountId) {
      log.info("Account already active, no switch needed");
      return;
    }

    try {
      const auth = this._authInstances.get(accountId);

      if (!auth) {
        throw new Error("Failed to restore account authentication");
      }

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new SessionExpiredError(account.email, accountId);
      }

      this._activeAccountId = accountId;

      account.lastActive = new Date();

      this._notifyAccountsChanged();

      log.info(`Switched to account: ${account.displayName}`);
    } catch (err) {
      log.error(`Failed to switch to account ${accountId}:`, err);
      throw err;
    }
  }

  public async removeAccount(accountId: string): Promise<void> {
    const accountIndex = this._accounts.findIndex((acc) => acc.id === accountId);

    if (accountIndex === -1) {
      throw new Error(`Account ${accountId} not found`);
    }
    try {
      this._authInstances.delete(accountId);

      const removedAccount = this._accounts[accountIndex];
      this._accounts.splice(accountIndex, 1);

      if (this._activeAccountId === accountId) {
        if (this._accounts.length > 0) {
          const sortedAccounts = [...this._accounts].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
          await this.switchAccount(sortedAccounts[0].id);
        } else {
          this._activeAccountId = null;
        }
      }

      this._notifyAccountsChanged();

      log.info(`Removed account: ${removedAccount.displayName}`);
    } catch (err) {
      log.error(`Failed to remove account ${accountId}:`, err);
      throw err;
    }
  }

  public getAccounts(): StoredAccount[] {
    return [...this._accounts].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }

  public getActiveAccountId(): string | null {
    return this._activeAccountId;
  }

  public getActiveAuth(): Auth | null {
    if (!this._activeAccountId) {
      return null;
    }

    return this._authInstances.get(this._activeAccountId) ?? null;
  }

  public onAccountsChange(
    onChange: (data: { accounts: StoredAccount[]; activeId: string | null }) => void,
  ): () => void {
    const subscription = this._onAccountsChanged.subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }
}

function mapUserToStoredAccount(user: AuthUser, defaultEmail: string = ""): StoredAccount {
  return {
    id: user.uid,
    email: user.email ?? defaultEmail,
    displayName: user.displayName ?? "",
    displayPicture: generateDisplayPicture(user.uid),
    lastActive: new Date(),
  };
}

function generateFakeUser(options: Partial<AuthUser>): AuthUser {
  const uid = options.uid ?? "userid";
  const fakeUser: AuthUser = {
    uid,
    displayName: options.displayName ?? "Demo user",
    displayPicture: options.displayPicture ?? generateDisplayPicture(uid),
    email: options.email ?? "fake@user.com",
    emailVerified: options.emailVerified ?? false,
  };
  return fakeUser;
}

export function createMultiAccountService(): MultiAccountService {
  return new MockMultiAccountClient();
}
