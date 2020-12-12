import firebase from "firebase";
import { assertDolphinInstallation } from "./downloadDolphin";

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
 * Handle complex initialisation steps here. To be run on App start.
 */
export async function init(log: (message: string) => void = console.log) {
  // Initialize firebase
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error(
      "Error initializing firebase. Did you forget to create a .env file from the .env.example file?",
      err
    );
  }

  // Check for Dolphin installation and download if necessary
  await assertDolphinInstallation(log);
}
