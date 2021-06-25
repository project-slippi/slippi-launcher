import firebase from "firebase";

import { deletePlayKey } from "./gql";

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
export async function initializeFirebase(): Promise<firebase.User | null> {
  // Initialize the Firebase app if we haven't already
  if (firebase.apps.length !== 0) {
    // We've already initialized the app before so just return the current user
    return Promise.resolve(firebase.auth().currentUser);
  }

  return new Promise((resolve, reject) => {
    try {
      firebase.initializeApp(firebaseConfig);

      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        // Unsubscribe after the first event
        unsubscribe();

        // Return the user
        resolve(user);
      });
    } catch (err) {
      console.warn("Error initializing firebase. Did you create a .env file from .env.example?");
      reject(err);
    }
  });
}

export const signUp = async (email: string, displayName: string, password: string) => {
  const createUser = firebase.functions().httpsCallable("createUser");
  await createUser({ email: email, password: password, displayName: displayName });
  return firebase.auth().signInWithEmailAndPassword(email, password);
};

export const login = async (email: string, password: string) => {
  return firebase.auth().signInWithEmailAndPassword(email, password);
};

export const logout = async () => {
  await firebase.auth().signOut();
  await deletePlayKey();
};

export const resetPassword = async (email: string) => {
  await firebase.auth().sendPasswordResetEmail(email);
};
