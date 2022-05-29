import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/displayPicture";

import { delayAndMaybeError } from "../utils";
import type { AuthService, AuthUser } from "./types";

const SHOULD_ERROR = false;

class MockAuthClient implements AuthService {
  private _currentUser: AuthUser | null = null;
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);

  @delayAndMaybeError(SHOULD_ERROR)
  public async init(): Promise<AuthUser | null> {
    return null;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async logout(): Promise<void> {
    this._setCurrentUser(null);
  }

  public getCurrentUser(): AuthUser | null {
    return this._currentUser;
  }

  public onUserChange(onChange: (user: AuthUser | null) => void): () => void {
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
  public async login(args: { email: string; password: string }): Promise<AuthUser | null> {
    if (args.email === "test" && args.password === "test") {
      return this._mockUser("Demo user");
    }
    throw new Error("Invalid username or password. Try 'test' and 'test'.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | null> {
    return this._mockUser(args.displayName);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async getUserToken(): Promise<string> {
    return "dummyToken";
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async updateDisplayName(displayName: string): Promise<void> {
    if (this._currentUser) {
      this._userSubject.next({
        ...this._currentUser,
        displayName,
      });
    }
  }

  private _mockUser(displayName: string) {
    const displayPicture = generateDisplayPicture("userid");
    const fakeUser = {
      uid: "userid",
      displayName,
      displayPicture,
    };
    this._setCurrentUser(fakeUser);
    return fakeUser;
  }

  private _setCurrentUser(user: AuthUser | null) {
    this._currentUser = user;
    this._userSubject.next(user);
  }
}

export default function createMockAuthClient(): AuthService {
  return new MockAuthClient();
}
