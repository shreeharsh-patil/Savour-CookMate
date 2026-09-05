import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
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

const isFirebaseConfigured = Boolean(firebaseProjectId && firebaseApiKey);
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  try {
    // Web manages its own persistence. Native uses AsyncStorage when available.
    if (Platform.OS === "web") {
      auth = getAuth(app);
    } else {
      const { getReactNativePersistence } = require("firebase/auth");
      auth = getReactNativePersistence
        ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
        : getAuth(app);
    }
  } catch {
    // initializeAuth can be called more than once during fast refresh.
    auth = getAuth(app);
  }
}

export { auth };

function requireAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase sign-in is not configured for this app.");
  }
  return auth;
}

export async function firebaseSignUp(email: string, pass: string, displayName?: string): Promise<{ token: string; user: FirebaseUser }> {
  const cred = await createUserWithEmailAndPassword(requireAuth(), email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  const token = await cred.user.getIdToken();
  await setStoredToken(token);
  return { token, user: cred.user };
}

export async function firebaseSignIn(email: string, pass: string): Promise<{ token: string; user: FirebaseUser }> {
  const cred = await signInWithEmailAndPassword(requireAuth(), email, pass);
  const token = await cred.user.getIdToken();
  await setStoredToken(token);
  return { token, user: cred.user };
}

export async function firebaseSignInWithGoogle(): Promise<{ token: string; user: FirebaseUser }> {
  const configuredAuth = requireAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  const cred = await signInWithPopup(configuredAuth, provider);
  const token = await cred.user.getIdToken();
  await setStoredToken(token);
  return { token, user: cred.user };
}

export async function firebaseSignOut(): Promise<void> {
  try {
    const configuredAuth = requireAuth();
    await fbSignOut(configuredAuth);
  } catch (err) {
    console.warn("Firebase sign out warning:", err);
  }
  await clearStoredToken();
}

export async function getFreshFirebaseIdToken(): Promise<string | null> {
  if (!auth) return null;
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
