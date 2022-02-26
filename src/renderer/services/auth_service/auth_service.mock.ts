import { multicast, Subject } from "observable-fns";

import type { AuthUser, IAuthService } from "./types";

export class MockAuthService implements IAuthService {
  private _currentUser: AuthUser | null = null;
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);

  public async logout(): Promise<void> {
    this._userSubject.next(null);
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

  public async resetPassword(): Promise<void> {
    // Do nothin
  }

  public async login(args: { email: string; password: string }): Promise<AuthUser | null> {
    if (args.email === "test" && args.password === "test") {
      return this._mockUser("Demo user");
    }
    throw new Error("Invalid username or password. Try 'test' and 'test'.");
  }

  public async signUp(args: { email: string; password: string; displayName: string }): Promise<AuthUser | null> {
    return this._mockUser(args.displayName);
  }

  private _mockUser(displayName = "Demo user") {
    const fakeUser = { uid: "userid", displayName };
    this._userSubject.next(fakeUser);
    return fakeUser;
  }
}
