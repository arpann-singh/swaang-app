import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// REPLACE WITH YOUR KEYS
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 1. Initialize App (Check if already initialized to prevent crashes on reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth with Persistence (Safe Check)
// Using an IIFE (Immediately Invoked Function Expression) to assign 'auth' as a const.
// This fixes the "implicitly has type 'any'" error in TypeScript.
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (e) {
    // If already initialized (hot reload), just get the existing instance
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
