import { Preconditions } from "@common/preconditions";
import type { User } from "firebase/auth";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import { delayAndMaybeError } from "../utils";
import { createMultiAccountService } from "./multi_account.service.mock";
import type { AuthService, AuthUser, MultiAccountService } from "./types";

const SHOULD_ERROR = false;

class MockAuthClient implements AuthService {
  private _userSubject = new Subject<AuthUser | undefined>();
  private _onAuthStateChanged = multicast(this._userSubject);
  private _multiAccountService: MultiAccountService;

  constructor() {
    this._multiAccountService = createMultiAccountService();

    this._multiAccountService.onAccountsChange(() => {
      const user = this.getCurrentUser();
      this._userSubject.next(user);
    });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async init(): Promise<AuthUser | undefined> {
    return undefined;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async logout(): Promise<void> {
    const activeAccountId = this._multiAccountService.getActiveAccountId();
    if (activeAccountId) {
      await this._multiAccountService.removeAccount(activeAccountId);
      this._userSubject.next(undefined);
    }
  }

  public getCurrentUser(): AuthUser | undefined {
    const auth = this._multiAccountService.getActiveAuth();
    if (!auth || !auth.currentUser) {
      return undefined;
    }
    return this._mapFirebaseUserToAuthUser(auth.currentUser);
  }

  public onUserChange(onChange: (user: AuthUser | undefined) => void): () => void {
    const subscription = this._onAuthStateChanged.subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async resetPassword(): Promise<void> {
    throw new Error("Mock reset password is not implemented");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async login(args: { email: string; password: string }): Promise<AuthUser | undefined> {
    await this._multiAccountService.addAccount(args.email, args.password);
    const user = this.getCurrentUser();

    this._userSubject.next(user);
    return user;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | undefined> {
    await this._multiAccountService.signUp(args.email, args.password, args.displayName);
    const user = this.getCurrentUser();
    this._userSubject.next(user);
    return user;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async getUserToken(): Promise<string> {
    return "dummyToken";
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async updateDisplayName(displayName: string): Promise<void> {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth?.currentUser, "User is not logged in.");

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

  @delayAndMaybeError(SHOULD_ERROR)
  public async refreshUser(): Promise<void> {
    const auth = this._multiAccountService.getActiveAuth();
    Preconditions.checkExists(auth, "No active account");
    Preconditions.checkExists(auth.currentUser, "User is not logged in.");

    await auth.currentUser.reload();
    // Notify listeners of the new user object
    this._userSubject.next(this.getCurrentUser());
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async sendVerificationEmail(): Promise<void> {
    // Do nothing
  }

  public getMultiAccountService(): any {
    // Mock implementation - return a basic mock
    return this._multiAccountService;
  }
  private _mapFirebaseUserToAuthUser(user: Pick<User, "uid" | "displayName" | "email" | "emailVerified">): AuthUser {
    const displayPicture = generateDisplayPicture(user.uid);
    const userObject = {
      uid: user.uid,
      displayName: user.displayName || "",
      displayPicture,
      email: user.email || "",
      emailVerified: user.emailVerified,
    };
    return userObject;
  }
}

export default function createMockAuthClient(): AuthService {
  return new MockAuthClient();
}
