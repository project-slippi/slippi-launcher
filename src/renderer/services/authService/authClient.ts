import firebase from "firebase/app";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import type { AuthService, AuthUser } from "./types";

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

export class AuthClient implements AuthService {
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);

  public init(): Promise<AuthUser | null> {
    // Initialize the Firebase app if we haven't already
    if (firebase.apps.length !== 0) {
      // We've already initialized the app before so just return the current user
      const currentUser = firebase.auth().currentUser;
      return Promise.resolve(currentUser ? this._mapFirebaseUserToAuthUser(currentUser) : null);
    }

    return new Promise((resolve, reject) => {
      try {
        firebase.initializeApp(firebaseConfig);

        // Setup the listener
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            this._userSubject.next(this._mapFirebaseUserToAuthUser(user));
          } else {
            this._userSubject.next(null);
          }
        });

        // Complete the promise
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          // Unsubscribe after the first event
          unsubscribe();

          resolve(user ? this._mapFirebaseUserToAuthUser(user) : null);
        });
      } catch (err) {
        console.warn("Error initializing firebase. Did you create a .env file from .env.example?");
        reject(err);
      }
    });
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
    return this.login({ email, password });
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
