import firebase from "firebase/app";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import type { AuthUser, IAuthService } from "./types";

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

/**
 * Initialize Firebase
 */

export class AuthService implements IAuthService {
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);

  public constructor() {
    try {
      firebase.initializeApp(firebaseConfig);

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this._userSubject.next(this._mapFirebaseUserToAuthUser(user));
        } else {
          this._userSubject.next(null);
        }
      });
    } catch (err) {
      console.warn("Error initializing firebase. Did you create a .env file from .env.example?");
      throw err;
    }
  }

  private _mapFirebaseUserToAuthUser(user: firebase.User): AuthUser {
    const userObject = {
      uid: user.uid,
      displayName: user.displayName ?? "",
    };
    console.log({ userObject });
    return userObject;
  }

  public onUserChange(onChange: (user: AuthUser | null) => void): () => void {
    const subscription = this._onAuthStateChanged.subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }

  public getCurrentUser(): AuthUser | null {
    const user = firebase.auth().currentUser;
    if (!user) {
      return null;
    }
    return this._mapFirebaseUserToAuthUser(user);
  }

  public async signUp({ email, displayName, password }: { email: string; displayName: string; password: string }) {
    const createUser = firebase.functions().httpsCallable("createUser");
    await createUser({ email, password, displayName });
    const { user } = await firebase.auth().signInWithEmailAndPassword(email, password);
    if (!user) {
      return null;
    }
    return this._mapFirebaseUserToAuthUser(user);
  }

  public async login({ email, password }: { email: string; password: string }) {
    const { user } = await firebase.auth().signInWithEmailAndPassword(email, password);
    if (!user) {
      return null;
    }
    return this._mapFirebaseUserToAuthUser(user);
  }

  public async logout() {
    await firebase.auth().signOut();
  }

  public async resetPassword(email: string) {
    await firebase.auth().sendPasswordResetEmail(email);
  }
}
