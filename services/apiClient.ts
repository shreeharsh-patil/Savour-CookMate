/**
 * Savour CookMate - Mobile API Client
 *
 * Implements:
 * - Centralized base URL configuration (points to Savour backend server)
 * - Timeout handling (prevents hanging network requests)
 * - Exponential backoff retry for resilient connectivity
 * - In-flight deduplication to eliminate duplicate requests
 * - Memory caching for instant navigation
 */

import { Platform } from 'react-native';

const DEFAULT_PORT = 3000;

// Determine appropriate localhost or LAN address for iOS / Android / Web
function getDefaultBaseUrl(): string {
  // If environment variable is set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // On Android emulator, localhost maps to 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  // On Web or iOS Simulator, localhost is 127.0.0.1
  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_BASE_URL = getDefaultBaseUrl();

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

const inFlightRequests = new Map<string, Promise<any>>();
const clientCache = new Map<string, { data: any; expiresAt: number }>();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, retries = 1, ...fetchOptions } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const cacheKey = `${options.method || 'GET'}:${url}:${fetchOptions.body ? String(fetchOptions.body) : ''}`;

  // 1. Check client memory cache (for GET requests or discover requests)
  if (options.method === 'GET' || cleanEndpoint.includes('/discover')) {
    const cached = clientCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
  }

  // 2. Check in-flight duplicate requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const executeRequest = async (attempt: number): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.message ||
            errorBody.error ||
            `Server returned status ${response.status}`
        );
      }

      const data = await response.json();

      // Cache successful response for 3 minutes
      clientCache.set(cacheKey, { data, expiresAt: Date.now() + 180000 });

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === 'AbortError';
      const errorMessage = isTimeout
        ? 'Connection timed out. Please check network connection.'
        : err.message || 'Unable to connect to Savour server.';

      if (attempt < retries && !isTimeout) {
        // Wait with exponential backoff before retry
        await new Promise((res) => setTimeout(res, 800 * Math.pow(2, attempt)));
        return executeRequest(attempt + 1);
      }

      throw new Error(errorMessage);
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  };

  const promise = executeRequest(0);
  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export function clearApiCache(): void {
  clientCache.clear();
}
