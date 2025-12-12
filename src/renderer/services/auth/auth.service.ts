import { Preconditions } from "@common/preconditions";
import log from "electron-log";
import {
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import { createMultiAccountService } from "./multi_account.service";
import type { AuthService, AuthUser, MultiAccountService } from "./types";

/**
 * Initialize Firebase with multi-account support
 */
class AuthClient implements AuthService {
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);
  private _multiAccountService: MultiAccountService;

  constructor() {
    this._multiAccountService = createMultiAccountService();
  }

  public async init(): Promise<AuthUser | null> {
    // Initialize multi-account service
    await this._multiAccountService.init();

    // Set up auth state listener on the active account
    this._setupAuthStateListener();

    return this.getCurrentUser();
  }

  /**
   * Set up listener for auth state changes on the active account
   */
  private _setupAuthStateListener(): void {
    const auth = this._multiAccountService.getActiveAuth();
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this._userSubject.next(this._mapFirebaseUserToAuthUser(user));
        } else {
          this._userSubject.next(null);
        }
      });
    }

    // When accounts change (switch, add, remove), update the listener
    this._multiAccountService.onAccountsChange(() => {
      const newAuth = this._multiAccountService.getActiveAuth();
      if (newAuth) {
        // The onAuthStateChanged listener will pick up the new auth state
        const user = newAuth.currentUser;
        if (user) {
          this._userSubject.next(this._mapFirebaseUserToAuthUser(user));
        } else {
          this._userSubject.next(null);
        }
      } else {
        this._userSubject.next(null);
      }
    });
  }

  /**
   * Get the multi-account service (for accessing multi-account features)
   */
  public getMultiAccountService(): MultiAccountService {
    return this._multiAccountService;
  }

  private _mapFirebaseUserToAuthUser(user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    emailVerified: boolean;
  }): AuthUser {
    const displayPicture = generateDisplayPicture(user.uid);
    const userObject = {
      uid: user.uid,
      displayName: user.displayName ?? "",
      displayPicture,
      email: user.email ?? "",
      emailVerified: user.emailVerified,
    };
    return userObject;
  }

  public onUserChange(onChange: (user: AuthUser | null) => void): () => void {
    const subscription = this._onAuthStateChanged.subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }

  public getCurrentUser(): AuthUser | null {
    const auth = this._multiAccountService.getActiveAuth();
    if (!auth || !auth.currentUser) {
      return null;
    }
    return this._mapFirebaseUserToAuthUser(auth.currentUser);
  }

  public async signUp({ email, displayName, password }: { email: string; displayName: string; password: string }) {
    // Delegate to multi-account service to create user and add account
    await this._multiAccountService.signUp(email, password, displayName);
    return this.getCurrentUser();
  }

  public async login({ email, password }: { email: string; password: string }) {
    // Add account via multi-account service (auto-switches if exists)
    await this._multiAccountService.addAccount(email, password);
    return this.getCurrentUser();
  }

  public async sendVerificationEmail() {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth, "No active account");
    Preconditions.checkExists(auth.currentUser, "User is not logged in.");

    if (!auth.currentUser.emailVerified) {
      log.info(`Sending email verification`);
      await sendEmailVerification(auth.currentUser);
    }
  }

  public async refreshUser(): Promise<void> {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth, "No active account");
    Preconditions.checkExists(auth.currentUser, "User is not logged in.");

    await auth.currentUser.reload();
    // Notify listeners of the new user object
    this._userSubject.next(this.getCurrentUser());
  }

  public async logout() {
    const activeAccountId = this._multiAccountService.getActiveAccountId();
    if (activeAccountId) {
      await this._multiAccountService.removeAccount(activeAccountId);
    }
  }

  public async resetPassword(email: string) {
    // Use the active auth or default app for password reset
    const auth = this._multiAccountService.getActiveAuth() ?? getAuth();
    await sendPasswordResetEmail(auth, email);
  }

  public async getUserToken(): Promise<string> {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth, "No active account");
    Preconditions.checkExists(auth.currentUser, "User is not logged in.");

    const token = await auth.currentUser.getIdToken();
    return token;
  }

  public async updateDisplayName(displayName: string): Promise<void> {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth, "No active account");
    Preconditions.checkExists(auth.currentUser, "User is not logged in.");

    await updateProfile(auth.currentUser, { displayName });

    // Update stored account info
    const activeAccountId = this._multiAccountService.getActiveAccountId();
    if (activeAccountId) {
      const accounts = this._multiAccountService.getAccounts();
      const account = accounts.find((acc) => acc.id === activeAccountId);
      if (account) {
        account.displayName = displayName;
        // The multi-account service will handle saving
      }
    }

    // Notify listeners
    this._userSubject.next(this.getCurrentUser());
  }
}

export default function createAuthClient(): AuthService {
  return new AuthClient();
}
