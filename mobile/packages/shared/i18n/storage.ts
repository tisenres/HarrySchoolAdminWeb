import { storage } from './index';
import { SupportedLanguage } from './types';

// Memory MCP server integration for cross-app language preference sync
interface LanguageMemoryService {
  storeLanguagePreference: (userId: string, language: SupportedLanguage) => Promise<void>;
  getLanguagePreference: (userId: string) => Promise<SupportedLanguage | null>;
  clearLanguagePreference: (userId: string) => Promise<void>;
  syncLanguageAcrossApps: (userId: string, language: SupportedLanguage) => Promise<void>;
}

// Local storage keys
const STORAGE_KEYS = {
  LANGUAGE: 'user_language_preference',
  USER_ID: 'current_user_id',
  LAST_SYNC: 'language_last_sync',
} as const;

/**
 * Enhanced language storage service with Memory MCP integration
 * Provides high-performance local storage with cross-app synchronization
 */
export class LanguageStorageService implements LanguageMemoryService {
  private static instance: LanguageStorageService;
  private syncInProgress: boolean = false;

  private constructor() {}

  public static getInstance(): LanguageStorageService {
    if (!LanguageStorageService.instance) {
      LanguageStorageService.instance = new LanguageStorageService();
    }
    return LanguageStorageService.instance;
  }

  /**
   * Store language preference locally with high performance MMKV
   */
  public storeLanguageLocally(language: SupportedLanguage): void {
    try {
      storage.set(STORAGE_KEYS.LANGUAGE, language);
      storage.set(STORAGE_KEYS.LAST_SYNC, Date.now());
      console.log(`Language preference stored locally: ${language}`);
    } catch (error) {
      console.error('Failed to store language locally:', error);
      throw new Error(`Local language storage failed: ${error}`);
    }
  }

  /**
   * Get language preference from local storage
   */
  public getLanguageLocally(): SupportedLanguage | null {
    try {
      return storage.getString(STORAGE_KEYS.LANGUAGE) as SupportedLanguage || null;
    } catch (error) {
      console.error('Failed to get language locally:', error);
      return null;
    }
  }

  /**
   * Store language preference with Memory MCP server integration
   */
  public async storeLanguagePreference(
    userId: string, 
    language: SupportedLanguage
  ): Promise<void> {
    try {
      // Store locally first for immediate access
      this.storeLanguageLocally(language);
      
      // Store user ID for sync operations
      storage.set(STORAGE_KEYS.USER_ID, userId);

      // Sync across apps using Memory MCP server
      await this.syncLanguageAcrossApps(userId, language);

      console.log(`Language preference stored and synced: ${language} for user ${userId}`);
    } catch (error) {
      console.error('Failed to store language preference:', error);
      // Don't throw here to ensure local storage still works
    }
  }

  /**
   * Get language preference with fallback chain
   */
  public async getLanguagePreference(userId: string): Promise<SupportedLanguage | null> {
    try {
      // First try local storage for immediate access
      const localLanguage = this.getLanguageLocally();
      if (localLanguage) {
        // Background sync check (non-blocking)
        this.backgroundSyncCheck(userId).catch(console.warn);
        return localLanguage;
      }

      // If no local preference, try to sync from memory server
      const memoryLanguage = await this.getLanguageFromMemory(userId);
      if (memoryLanguage) {
        this.storeLanguageLocally(memoryLanguage);
        return memoryLanguage;
      }

      return null;
    } catch (error) {
      console.error('Failed to get language preference:', error);
      // Fallback to local storage only
      return this.getLanguageLocally();
    }
  }

  /**
   * Clear language preference from all storage locations
   */
  public async clearLanguagePreference(userId: string): Promise<void> {
    try {
      // Clear local storage
      storage.delete(STORAGE_KEYS.LANGUAGE);
      storage.delete(STORAGE_KEYS.LAST_SYNC);
      
      // Clear from memory server
      await this.clearLanguageFromMemory(userId);
      
      console.log(`Language preference cleared for user ${userId}`);
    } catch (error) {
      console.error('Failed to clear language preference:', error);
      // Ensure local storage is cleared regardless
      storage.delete(STORAGE_KEYS.LANGUAGE);
    }
  }

  /**
   * Synchronize language preference across Student and Teacher apps
   */
  public async syncLanguageAcrossApps(
    userId: string, 
    language: SupportedLanguage
  ): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      // Store in memory server with app-specific keys
      const memoryKey = `language_preference_${userId}`;
      const syncData = {
        language,
        timestamp: Date.now(),
        userId,
        apps: ['student', 'teacher'],
      };

      // This would integrate with the actual Memory MCP server
      // For now, we simulate the storage structure
      await this.storeInMemoryServer(memoryKey, syncData);

      console.log(`Language synced across apps: ${language} for user ${userId}`);
    } catch (error) {
      console.error('Failed to sync language across apps:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Background sync check to ensure consistency
   */
  private async backgroundSyncCheck(userId: string): Promise<void> {
    try {
      const lastSync = storage.getNumber(STORAGE_KEYS.LAST_SYNC) || 0;
      const syncAge = Date.now() - lastSync;
      
      // Sync if last sync was more than 5 minutes ago
      if (syncAge > 5 * 60 * 1000) {
        const memoryLanguage = await this.getLanguageFromMemory(userId);
        const localLanguage = this.getLanguageLocally();
        
        if (memoryLanguage && memoryLanguage !== localLanguage) {
          this.storeLanguageLocally(memoryLanguage);
          console.log(`Background sync updated language to: ${memoryLanguage}`);
        }
      }
    } catch (error) {
      console.warn('Background sync check failed:', error);
    }
  }

  /**
   * Get language from memory server (simulated)
   */
  private async getLanguageFromMemory(userId: string): Promise<SupportedLanguage | null> {
    try {
      const memoryKey = `language_preference_${userId}`;
      const syncData = await this.getFromMemoryServer(memoryKey);
      
      return syncData?.language || null;
    } catch (error) {
      console.warn('Failed to get language from memory server:', error);
      return null;
    }
  }

  /**
   * Clear language from memory server (simulated)
   */
  private async clearLanguageFromMemory(userId: string): Promise<void> {
    try {
      const memoryKey = `language_preference_${userId}`;
      await this.deleteFromMemoryServer(memoryKey);
    } catch (error) {
      console.warn('Failed to clear language from memory server:', error);
    }
  }

  /**
   * Store data in Memory MCP server (simulated interface)
   * In actual implementation, this would use the Memory MCP server tools
   */
  private async storeInMemoryServer(key: string, data: any): Promise<void> {
    // This would be replaced with actual Memory MCP server integration
    console.log(`[MEMORY MCP] Storing ${key}:`, data);
    
    // Simulate storage operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get data from Memory MCP server (simulated interface)
   */
  private async getFromMemoryServer(key: string): Promise<any | null> {
    // This would be replaced with actual Memory MCP server integration
    console.log(`[MEMORY MCP] Getting ${key}`);
    
    // Simulate retrieval operation
    await new Promise(resolve => setTimeout(resolve, 50));
    return null; // Would return actual data from memory server
  }

  /**
   * Delete data from Memory MCP server (simulated interface)
   */
  private async deleteFromMemoryServer(key: string): Promise<void> {
    // This would be replaced with actual Memory MCP server integration
    console.log(`[MEMORY MCP] Deleting ${key}`);
    
    // Simulate deletion operation
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Get current user ID for storage operations
   */
  public getCurrentUserId(): string | null {
    try {
      return storage.getString(STORAGE_KEYS.USER_ID) || null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  /**
   * Initialize language storage service
   */
  public async initialize(userId?: string): Promise<void> {
    try {
      if (userId) {
        storage.set(STORAGE_KEYS.USER_ID, userId);
      }

      const currentUserId = this.getCurrentUserId();
      if (currentUserId) {
        // Attempt to sync language preferences on initialization
        await this.backgroundSyncCheck(currentUserId);
      }

      console.log('Language storage service initialized');
    } catch (error) {
      console.error('Failed to initialize language storage service:', error);
    }
  }
}

// Export singleton instance
export const languageStorage = LanguageStorageService.getInstance();

// Convenience functions for easy integration
export const storeLanguagePreference = async (
  userId: string,
  language: SupportedLanguage
): Promise<void> => {
  return languageStorage.storeLanguagePreference(userId, language);
};

export const getLanguagePreference = async (
  userId: string
): Promise<SupportedLanguage | null> => {
  return languageStorage.getLanguagePreference(userId);
};

export const clearLanguagePreference = async (
  userId: string
): Promise<void> => {
  return languageStorage.clearLanguagePreference(userId);
};

export const syncLanguageAcrossApps = async (
  userId: string,
  language: SupportedLanguage
): Promise<void> => {
  return languageStorage.syncLanguageAcrossApps(userId, language);
};

export const initializeLanguageStorage = async (userId?: string): Promise<void> => {
  return languageStorage.initialize(userId);
};