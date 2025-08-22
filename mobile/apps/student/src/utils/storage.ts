// Web-compatible storage utility
import { Platform } from 'react-native';

class WebStorage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    // For native platforms, use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    // For native platforms, use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    // For native platforms, use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.clear();
      return;
    }
    // For native platforms, use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.clear();
  }
}

export const storage = new WebStorage();