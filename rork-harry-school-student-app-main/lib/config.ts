import AsyncStorage from '@react-native-async-storage/async-storage';

let apiBaseUrl: string | null = process.env.EXPO_PUBLIC_API_BASE_URL ?? null;

const STORAGE_KEYS = {
  apiBaseUrl: 'config_api_base_url',
} as const;

export async function initConfig(): Promise<void> {
  try {
    const storedApi = await AsyncStorage.getItem(STORAGE_KEYS.apiBaseUrl);
    if (storedApi) apiBaseUrl = storedApi;
  } catch (e) {
    console.log('[config] init error', e);
  }
}

export function getApiBaseUrl(): string | null {
  return apiBaseUrl;
}

export async function setApiBaseUrl(url: string | null): Promise<void> {
  apiBaseUrl = url;
  try {
    if (url) {
      await AsyncStorage.setItem(STORAGE_KEYS.apiBaseUrl, url);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
    }
  } catch (e) {
    console.log('[config] setApiBaseUrl error', e);
  }
}
