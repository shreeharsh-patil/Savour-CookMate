import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

const TOKEN_KEY = "@yummy_tummy_auth_token";
const LEGACY_TOKEN_KEY = "@savour_cookmate_auth_token";
const GUEST_ID_KEY = "@yummy_tummy_guest_id";
const LEGACY_GUEST_ID_KEY = "@savour_cookmate_guest_id";

// Storage is comparatively expensive on mobile. Keep values in memory after
// the first safe read while AsyncStorage remains the durable source of truth.
let tokenCache: string | null | undefined;
let tokenReadInFlight: Promise<string | null> | null = null;
let guestIdCache: string | null = null;
let guestIdReadInFlight: Promise<string> | null = null;

async function readWithMigration(key: string, legacyKey: string): Promise<string | null> {
  const current = await AsyncStorage.getItem(key);
  if (current !== null) return current;

  const legacy = await AsyncStorage.getItem(legacyKey);
  if (legacy === null) return null;

  await AsyncStorage.setItem(key, legacy);
  await AsyncStorage.removeItem(legacyKey);
  return legacy;
}

/**
 * Deterministically resolves backend URL based on platform and environment.
 */
export const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const isProduction = process.env.NODE_ENV === "production";

  // Production MUST use explicitly configured EXPO_PUBLIC_API_URL
  if (isProduction) {
    if (!envUrl) {
      throw new Error(
        "Production configuration error: EXPO_PUBLIC_API_URL must be explicitly configured."
      );
    }
    return envUrl;
  }

  // If a custom non-localhost URL is provided in env, use it directly
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // Extract Metro host IP if available
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  const hostIp = hostUri ? hostUri.split(":")[0] : null;
  const hasValidLanIp =
    Boolean(hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1");

  if (Platform.OS === "android") {
    // Android emulator cannot reach host via 'localhost' (points to emulator itself).
    // Physical device requires the Metro LAN host IP.
    // Emulator works with 10.0.2.2 or LAN host IP.
    if (hasValidLanIp) {
      return `http://${hostIp}:3000`;
    }
    return "http://10.0.2.2:3000";
  }

  if (Platform.OS === "ios") {
    if (hasValidLanIp) {
      return `http://${hostIp}:3000`;
    }
    return "http://localhost:3000";
  }

  // Web and fallback
  return envUrl || "http://localhost:3000";
};

export async function getStoredToken(): Promise<string | null> {
  if (tokenCache !== undefined) return tokenCache;
  if (tokenReadInFlight) return tokenReadInFlight;

  tokenReadInFlight = (async () => {
  try {
      tokenCache = await readWithMigration(TOKEN_KEY, LEGACY_TOKEN_KEY);
      return tokenCache;
  } catch {
      tokenCache = null;
      return null;
    } finally {
      tokenReadInFlight = null;
    }
  })();
  return tokenReadInFlight;
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    tokenCache = token;
  } catch (err) {
    console.warn("Error saving auth token:", err);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, LEGACY_TOKEN_KEY]);
    tokenCache = null;
  } catch (err) {
    console.warn("Error clearing auth token:", err);
  }
}

/**
 * Retrieves or generates a unique persistent guest session identifier
 */
export async function getPersistentGuestId(): Promise<string> {
  if (guestIdCache) return guestIdCache;
  if (guestIdReadInFlight) return guestIdReadInFlight;

  guestIdReadInFlight = (async () => {
  try {
    const existing = await readWithMigration(GUEST_ID_KEY, LEGACY_GUEST_ID_KEY);
    if (existing && existing.startsWith("guest_")) {
      guestIdCache = existing;
      return existing;
    }
    const newGuestId = `guest_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    await AsyncStorage.setItem(GUEST_ID_KEY, newGuestId);
    guestIdCache = newGuestId;
    return newGuestId;
  } catch {
      const ephemeralGuestId = `guest_${Date.now().toString(36)}`;
      guestIdCache = ephemeralGuestId;
      return ephemeralGuestId;
    } finally {
      guestIdReadInFlight = null;
    }
  })();
  return guestIdReadInFlight;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Reusable fetch with AbortController timeout guaranteeing no hanging requests.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external signal if supplied
  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isGenuineNetworkError(err: any): boolean {
  if (!err) return false;
  if (err.name === "AbortError") return true;
  const msg = (err.message || "").toLowerCase();
  return (
    msg.includes("failed to connect") ||
    msg.includes("network request failed") ||
    msg.includes("connection refused") ||
    msg.includes("econnrefused") ||
    msg.includes("network unreachable") ||
    msg.includes("timed out") ||
    msg.includes("fetch failed")
  );
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const token = await getStoredToken();
  const guestId = !token ? await getPersistentGuestId() : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (fetchOptions.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (guestId) {
    headers["Authorization"] = `Bearer ${guestId}`;
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers,
      timeoutMs,
    });
  } catch (primaryErr: any) {
    // Only attempt development fallback for GENUINE transport network errors
    const isDev = process.env.NODE_ENV !== "production";
    const canAttemptFallback =
      isDev &&
      !endpoint.startsWith("http") &&
      Platform.OS === "android" &&
      isGenuineNetworkError(primaryErr);

    if (canAttemptFallback) {
      // If primary was LAN IP, fallback to 10.0.2.2.
      // If primary was 10.0.2.2, check if hostIp exists.
      // NEVER use localhost on Android!
      const hostUri = Constants.expoConfig?.hostUri;
      const hostIp = hostUri ? hostUri.split(":")[0] : null;

      let fallbackBase: string | null = null;
      if (url.includes("10.0.2.2") && hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
        fallbackBase = `http://${hostIp}:3000`;
      } else if (!url.includes("10.0.2.2")) {
        fallbackBase = "http://10.0.2.2:3000";
      }

      if (fallbackBase) {
        const fallbackUrl = `${fallbackBase}${endpoint}`;
        try {
          response = await fetchWithTimeout(fallbackUrl, {
            ...fetchOptions,
            headers,
            timeoutMs,
          });
        } catch {
          // Fallback failed, throw original error
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    } else {
      if (primaryErr.name === "AbortError") {
        throw new Error("Request timed out. Please check your network connection.");
      }
      throw primaryErr;
    }
  }

  // Preserve actual HTTP error codes from server (DO NOT RETRY 4xx or 5xx)
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // use default HTTP error
    }
    const httpErr: any = new Error(errorMessage);
    httpErr.status = response.status;
    throw httpErr;
  }

  return (await response.json()) as T;
}
