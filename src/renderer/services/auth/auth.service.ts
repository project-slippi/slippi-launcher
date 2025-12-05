import { Preconditions } from "@common/preconditions";
import log from "electron-log";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import multicast from "observable-fns/multicast";
import Subject from "observable-fns/subject";

import { generateDisplayPicture } from "@/lib/display_picture";

import { createMultiAccountService } from "./multi_account.service";
import type { AuthService, AuthUser, MultiAccountService } from "./types";

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

// Flag to enable multi-account mode (default: true for new implementation)
const ENABLE_MULTI_ACCOUNT = true;

class AuthClient implements AuthService {
  private _userSubject = new Subject<AuthUser | null>();
  private _onAuthStateChanged = multicast(this._userSubject);
  private _multiAccountService: MultiAccountService | null = null;

  constructor() {
    if (ENABLE_MULTI_ACCOUNT) {
      this._multiAccountService = createMultiAccountService();
    }
  }

  public async init(): Promise<AuthUser | null> {
    // Use multi-account service if enabled
    if (this._multiAccountService) {
      const user = await this._multiAccountService.init();

      // Set up listener to forward events from multi-account service
      this._multiAccountService.onUserChange((user) => {
        this._userSubject.next(user);
      });

      return user;
    }

    // Legacy single-account mode
    // Initialize the Firebase app if we haven't already
    if (getApps().length !== 0) {
      // We've already initialized the app before so just return the current user
      return Promise.resolve(this.getCurrentUser());
    }

    return new Promise((resolve, reject) => {
      try {
        const firebaseApp = initializeApp(firebaseConfig);

        const auth = getAuth(firebaseApp);
        // Setup the listener
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this._userSubject.next(this._mapFirebaseUserToAuthUser(user));
          } else {
            this._userSubject.next(null);
          }
        });

        // Complete the promise
        const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  /**
   * Get the multi-account service (for accessing multi-account features)
   */
  public getMultiAccountService(): MultiAccountService | null {
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
    if (this._multiAccountService) {
      return this._multiAccountService.getCurrentUser();
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return this._mapFirebaseUserToAuthUser(user);
  }

  public async signUp({ email, displayName, password }: { email: string; displayName: string; password: string }) {
    if (this._multiAccountService) {
      return this._multiAccountService.signUp({ email, displayName, password });
    }

    const functions = getFunctions();
    const createUser = httpsCallable(functions, "createUserNew");
    await createUser({ email, password, displayName });
    return this.login({ email, password });
  }

  public async login({ email, password }: { email: string; password: string }) {
    if (this._multiAccountService) {
      return this._multiAccountService.login({ email, password });
    }

    const auth = getAuth();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user) {
      return null;
    }

    return this._mapFirebaseUserToAuthUser(user);
  }

  public async sendVerificationEmail() {
    if (this._multiAccountService) {
      return this._multiAccountService.sendVerificationEmail();
    }

    const auth = getAuth();
    const user = auth.currentUser;
    Preconditions.checkExists(user, "User is not logged in.");

    if (!user.emailVerified) {
      log.info(`Sending email verification`);
      await sendEmailVerification(user);
    }
  }

  public async refreshUser(): Promise<void> {
    if (this._multiAccountService) {
      return this._multiAccountService.refreshUser();
    }

    const auth = getAuth();
    const user = auth.currentUser;
    Preconditions.checkExists(user, "User is not logged in.");

    await user.reload();
    // Notify listeners of the new user object
    this._userSubject.next(this.getCurrentUser());
  }

  public async logout() {
    if (this._multiAccountService) {
      await this._multiAccountService.logout();
      return;
    }

    const auth = getAuth();
    await auth.signOut();
  }

  public async resetPassword(email: string) {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
  }

  public async getUserToken(): Promise<string> {
    if (this._multiAccountService) {
      return this._multiAccountService.getUserToken();
    }

    const auth = getAuth();
    const user = auth.currentUser;
    Preconditions.checkExists(user, "User is not logged in.");

    const token = await user.getIdToken();
    return token;
  }

  public async updateDisplayName(displayName: string): Promise<void> {
    if (this._multiAccountService) {
      return this._multiAccountService.updateDisplayName(displayName);
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw Error("User is not logged in.");
    }
    await updateProfile(user, { displayName });
  }
}

export default function createAuthClient(): AuthService {
  return new AuthClient();
}
