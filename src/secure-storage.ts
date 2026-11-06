import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * expo-secure-store has no web implementation, so `npm run web` would throw on
 * the first token read. Web falls back to localStorage — fine for a browser
 * preview, and the real (Android) target still gets the encrypted store.
 */
const useWebFallback = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (useWebFallback) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (useWebFallback) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (useWebFallback) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
