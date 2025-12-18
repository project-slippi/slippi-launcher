import { Preconditions } from "@common/preconditions";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import { delayAndMaybeError } from "../utils";
import type { AuthService, AuthUser } from "./types";

const SHOULD_ERROR = false;

const testUserEmail = "test";
const testUserPassword = "test";

class MockAuthClient implements AuthService {
  private _usersMap = new Map<string, AuthUser>();
  private _currentUser?: AuthUser;
  private _userSubject = new Subject<AuthUser | undefined>();
  private _onAuthStateChanged = multicast(this._userSubject);

  constructor() {
    // Add our fake user
    const testUser = generateFakeUser({
      email: testUserEmail,
      emailVerified: true,
    });
    this._usersMap.set(this._hashEmailPassword(testUserEmail, testUserPassword), testUser);
  }

  private _hashEmailPassword(email: string, password: string): string {
    return `email:${email}+password:${password}`;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async init(): Promise<AuthUser | undefined> {
    return undefined;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async logout(): Promise<void> {
    this._setCurrentUser(undefined);
  }

  public getCurrentUser(): AuthUser | undefined {
    return this._currentUser;
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
    const hash = this._hashEmailPassword(args.email, args.password);
    const user = this._usersMap.get(hash);
    if (!user) {
      throw new Error(`Invalid username or password. Try '${testUserEmail}' and '${testUserPassword}'.`);
    }
    this._setCurrentUser(user);
    return user;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | undefined> {
    const uid = args.email + args.displayName;
    const newUser = generateFakeUser({ ...args, uid });
    this._usersMap.set(this._hashEmailPassword(args.email, args.password), newUser);
    this._setCurrentUser(newUser);
    return newUser;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async getUserToken(): Promise<string> {
    return "dummyToken";
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async updateDisplayName(displayName: string): Promise<void> {
    this._updateCurrentUser({ displayName });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async refreshUser(): Promise<void> {
    this._updateCurrentUser({ emailVerified: true });
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async sendVerificationEmail(): Promise<void> {
    // Do nothing
  }

  private _updateCurrentUser(newUserDetails: Partial<AuthUser>): AuthUser {
    const user = this._currentUser;
    Preconditions.checkExists(user, "User is not logged in.");

    const maybeUserRecord = Array.from(this._usersMap.entries()).find(([_, u]) => user.uid === u.uid);
    Preconditions.checkExists(maybeUserRecord, `Could not find user with id: ${user.uid}`);

    const [key, userRecord] = maybeUserRecord;
    const updatedUser: AuthUser = { ...userRecord, ...newUserDetails };
    this._usersMap.set(key, updatedUser);
    this._setCurrentUser(updatedUser);
    return updatedUser;
  }

  public getMultiAccountService(): any {
    // Mock implementation - return a basic mock
    return {
      init: async () => {},
      addAccount: async () => ({ id: "", email: "", displayName: "", displayPicture: "", lastActive: new Date() }),
      removeAccount: async () => {},
      switchAccount: async () => {},
      getAccounts: () => [],
      getActiveAccountId: () => undefined,
      getActiveAuth: () => undefined,
      onAccountsChange: () => () => {},
    };
  }

  private _setCurrentUser(user: AuthUser | undefined) {
    this._currentUser = user;
    this._userSubject.next(user);
  }
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

export default function createMockAuthClient(): AuthService {
  return new MockAuthClient();
}
