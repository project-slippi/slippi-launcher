import firebase from 'firebase';

import { setAuthUser } from '../actions/auth';
import { store } from '../index';

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

// Initialize firebase and mirror user to store
// eslint-disable-next-line import/prefer-default-export
export function initializeFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().onAuthStateChanged(user => {
      store.dispatch(setAuthUser(user));
    });
  } catch (err) {
    console.error("Error initializing firebase. Did you forget to create a .env file from the .env.example file?", err);
  }
}
