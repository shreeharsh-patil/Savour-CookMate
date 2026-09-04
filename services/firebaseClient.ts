import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setStoredToken, clearStoredToken } from "./apiClient";

// These values MUST come from the Firebase Console (web app config). Do not fall back
// to a fake/legacy project - email & Google sign-in would silently target the wrong app.
const firebaseProjectId = (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
const firebaseApiKey = (process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "").trim();

if (!firebaseProjectId || !firebaseApiKey) {
  console.warn(
    "[firebaseClient] EXPO_PUBLIC_FIREBASE_API_KEY / EXPO_PUBLIC_FIREBASE_PROJECT_ID are not set. " +
      "Email & Google sign-in will not work until they are configured (see .env.example)."
  );
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  projectId: firebaseProjectId,
  authDomain: firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : undefined,
  storageBucket: firebaseProjectId ? `${firebaseProjectId}.appspot.com` : undefined,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// React Native persistence handler
let auth: Auth;
try {
  // Try initializing with React Native AsyncStorage persistence if available
  const { getReactNativePersistence } = require("firebase/auth");
  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

export { auth };

export async function firebaseSignUp(email: string, pass: string, displayName?: string): Promise<{ token: string; user: FirebaseUser }> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  const token = await cred.user.getIdToken();
  await setStoredToken(token);
  return { token, user: cred.user };
}

export async function firebaseSignIn(email: string, pass: string): Promise<{ token: string; user: FirebaseUser }> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const token = await cred.user.getIdToken();
  await setStoredToken(token);
  return { token, user: cred.user };
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn("Firebase sign out warning:", err);
  }
  await clearStoredToken();
}

export async function getFreshFirebaseIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    const token = await currentUser.getIdToken(true);
    await setStoredToken(token);
    return token;
  } catch {
    return null;
  }
}
