import firebase from "firebase";

import { deletePlayKey } from "./playkey";

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
export function initializeFirebase(): firebase.auth.Auth {
  // Initialize the Firebase app if we haven't already
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase.auth();
}

export const signUp = async (email: string, password: string) => {
  return firebase.auth().createUserWithEmailAndPassword(email, password);
};

export const login = async (email: string, password: string) => {
  return firebase.auth().signInWithEmailAndPassword(email, password);
};

export const logout = async () => {
  await firebase.auth().signOut();
  await deletePlayKey();
};
