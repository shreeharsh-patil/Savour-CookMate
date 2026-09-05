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
  signInWithCredential,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
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

  if (Platform.OS === "web") {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const cred = await signInWithPopup(configuredAuth, provider);
    const token = await cred.user.getIdToken();
    await setStoredToken(token);
    return { token, user: cred.user };
  }

  // Native Android & iOS flow via Expo AuthSession
  const webClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "").trim();
  const androidClientId = (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "").trim();
  const iosClientId = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "").trim();

  const clientId = Platform.select({
    ios: iosClientId || webClientId,
    android: androidClientId || webClientId,
    default: webClientId,
  });

  if (!clientId) {
    throw new Error(
      "Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, or EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID."
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "yummytummy",
  });

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: {
      nonce: Math.random().toString(36).substring(2, 15),
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params?.id_token) {
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Google sign-in was cancelled.");
    }
    throw new Error("Failed to receive valid credentials from Google sign-in.");
  }

  const googleCredential = GoogleAuthProvider.credential(result.params.id_token);
  const userCredential = await signInWithCredential(configuredAuth, googleCredential);
  const token = await userCredential.user.getIdToken();
  await setStoredToken(token);
  return { token, user: userCredential.user };
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
