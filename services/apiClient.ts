import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Dynamically determine backend URL for Android Emulator, Physical Device, and iOS/Web
export const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If a production or custom non-localhost URL is provided, use it directly
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // Extract host IP from Expo Metro bundler connection if running via Expo Go
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  const hostIp = hostUri ? hostUri.split(":")[0] : null;

  if (Platform.OS === "android") {
    // 1. If Metro reports a LAN IP (e.g. 10.x.x.x or 192.168.x.x), use it for physical device & emulator
    if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
      return `http://${hostIp}:3000`;
    }
    // 2. Android emulator virtual gateway to host machine loopback
    return "http://10.0.2.2:3000";
  }

  if (Platform.OS === "ios" && hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
    return `http://${hostIp}:3000`;
  }

  return envUrl || "http://localhost:3000";
};

const TOKEN_KEY = "@savour_cookmate_auth_token";

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn("Error saving auth token:", err);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn("Error clearing auth token:", err);
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const token = await getStoredToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // A JSON content type on a body-less GET request is rejected by some
  // fetch implementations and servers.
  if (fetchOptions.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Fallback anonymous guest token for unauthenticated browsing
    headers["Authorization"] = "Bearer guest_default";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // use default HTTP error
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Automatic Android local network failover (e.g. LAN IP <-> 10.0.2.2 emulator alias)
    if (Platform.OS === "android" && !endpoint.startsWith("http")) {
      const isUsing10_0_2_2 = url.includes("10.0.2.2");
      const fallbackBase = isUsing10_0_2_2 ? "http://localhost:3000" : "http://10.0.2.2:3000";
      const fallbackUrl = `${fallbackBase}${endpoint}`;

      if (fallbackUrl !== url) {
        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            ...fetchOptions,
            headers,
          });
          if (fallbackResponse.ok) {
            return (await fallbackResponse.json()) as T;
          }
        } catch {
          // Ignore fallback failure, throw original
        }
      }
    }

    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your network connection.");
    }
    throw err;
  }
}
