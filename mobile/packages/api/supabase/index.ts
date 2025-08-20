import { Platform } from 'react-native';
import { createMobileSupabaseClient, getMobileSupabaseClient, MobileSupabaseClient } from './client';
import { PerformanceManager } from './performance';
import type { 
  SupabaseConfig, 
  SupabaseResponse, 
  SupabasePaginatedResponse, 
  ConnectionStatus,
  MobileApiClient,
  QueryOptions,
  RealtimeSubscriptionOptions,
  RealtimeEvent
} from '../types/supabase';

/**
 * Initialize the mobile Supabase client with default configuration
 */
export const initializeSupabase = (config?: Partial<SupabaseConfig>): MobileSupabaseClient => {
  const defaultConfig: SupabaseConfig = {
    appVersion: '1.0.0',
    enableOfflineQueue: true,
    enablePerformanceMonitoring: true,
    cacheConfig: {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
    },
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
    },
    securityConfig: {
      sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
      maxInactiveTime: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
    },
    ...config,
  };

  return createMobileSupabaseClient(defaultConfig);
};

/**
 * Get the current Supabase client instance
 */
export const getSupabaseClient = (): MobileSupabaseClient | null => {
  return getMobileSupabaseClient();
};

/**
 * High-level API client that wraps the mobile Supabase client
 * Provides a simplified interface for common operations
 */
export class HarrySchoolApiClient implements MobileApiClient {
  private client: MobileSupabaseClient;
  private performanceManager: PerformanceManager;

  constructor(client: MobileSupabaseClient) {
    this.client = client;
    this.performanceManager = new PerformanceManager();
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<SupabaseResponse<any>> {
    return this.client.signIn(email, password);
  }

  async signOut(): Promise<void> {
    return this.client.signOut();
  }

  async refreshSession(): Promise<SupabaseResponse<any>> {
    const session = await this.client.getSession();
    if (session) {
      return { data: session, error: null };
    }
    return { data: null, error: { message: 'No active session to refresh' } };
  }

  async getCurrentUser(): Promise<any> {
    return this.client.getUser();
  }

  // Query methods with performance optimization
  async query<T>(
    queryFn: (client: any) => Promise<SupabaseResponse<T>>,
    options?: QueryOptions
  ): Promise<SupabaseResponse<T>> {
    const supabaseClient = this.client.getClient();
    if (!supabaseClient) {
      return { data: null, error: { message: 'Supabase client not available' } };
    }

    // Generate query key for caching
    const queryKey = this.generateQueryKey(queryFn, options);
    
    return this.performanceManager.executeQuery(
      queryKey,
      queryFn,
      supabaseClient,
      {
        ttl: options?.ttl,
        forceRefresh: options?.forceRefresh,
        enableCache: options?.enableCache,
        priority: options?.priority,
        networkOptimized: options?.networkOptimized,
      }
    );
  }

  // Realtime subscription methods
  subscribe<T>(
    options: RealtimeSubscriptionOptions,
    callback: (event: RealtimeEvent<T>) => void
  ): () => void {
    const supabaseClient = this.client.getClient();
    if (!supabaseClient) {
      console.error('Supabase client not available for subscription');
      return () => {};
    }

    let subscription: any = null;

    try {
      subscription = supabaseClient
        .channel(`${options.table}_changes`)
        .on(
          'postgres_changes',
          {
            event: options.event || '*',
            schema: 'public',
            table: options.table,
            filter: options.filter,
          },
          (payload: any) => {
            const realtimeEvent: RealtimeEvent<T> = {
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
              timestamp: Date.now(),
              table: options.table,
            };
            callback(realtimeEvent);
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Failed to create subscription:', error);
    }

    // Return unsubscribe function
    return () => {
      if (subscription) {
        supabaseClient.removeChannel(subscription);
      }
    };
  }

  // Offline queue methods
  async getQueueStatus(): Promise<{
    totalOperations: number;
    operationsByPriority: Record<string, number>;
    conflicts: number;
    isProcessing: boolean;
  }> {
    // This would be implemented in the offline queue
    return {
      totalOperations: 0,
      operationsByPriority: {},
      conflicts: 0,
      isProcessing: false,
    };
  }

  async resolveConflict(operationId: string, resolution: any): Promise<void> {
    // Implementation would depend on the offline queue
    console.log('Resolving conflict:', operationId, resolution);
  }

  // Performance methods
  getCacheStats(): any {
    return this.performanceManager.getCacheStats();
  }

  async invalidateCache(pattern?: string): Promise<void> {
    return this.performanceManager.invalidateCache(pattern);
  }

  // Connection methods
  getConnectionStatus(): ConnectionStatus {
    return this.client.getConnectionStatus();
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.client.onConnectionStatusChange(callback);
  }

  // Utility methods
  private generateQueryKey(queryFn: Function, options?: QueryOptions): string {
    // Simple query key generation - in production, you'd want something more sophisticated
    const fnString = queryFn.toString();
    const optionsString = JSON.stringify(options || {});
    return `query_${this.hash(fnString + optionsString)}`;
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Cleanup method
  cleanup(): void {
    this.client.cleanup();
    this.performanceManager.cleanup();
  }
}

/**
 * Create a high-level API client
 */
export const createApiClient = (client?: MobileSupabaseClient): HarrySchoolApiClient => {
  const supabaseClient = client || getMobileSupabaseClient();
  if (!supabaseClient) {
    throw new Error('Supabase client must be initialized before creating API client');
  }
  return new HarrySchoolApiClient(supabaseClient);
};

// Export individual components
export { MobileSupabaseClient } from './client';
export { OfflineQueue } from './offline-queue';
export { ErrorHandler } from './error-handler';
export { SecurityManager } from './security';
export { PerformanceManager } from './performance';

// Export types
export type {
  SupabaseConfig,
  SupabaseResponse,
  SupabasePaginatedResponse,
  ConnectionStatus,
  QueryOptions,
  RealtimeSubscriptionOptions,
  RealtimeEvent,
  MobileApiClient,
} from '../types/supabase';

// Export database types
export type { Database } from '../types/database';

// Environment configuration helpers
export const getEnvironmentConfig = (): Partial<SupabaseConfig> => {
  // Get configuration from environment variables
  const config: Partial<SupabaseConfig> = {};
  
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    config.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  }
  
  if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    config.supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }
  
  // Development vs production settings
  if (__DEV__) {
    config.enablePerformanceMonitoring = true;
    config.cacheConfig = {
      defaultTTL: 1 * 60 * 1000, // Shorter cache in development
    };
  } else {
    config.enablePerformanceMonitoring = false; // Disable in production unless needed
  }
  
  return config;
};

/**
 * Quick setup function for common use cases
 */
export const setupHarrySchoolApi = (customConfig?: Partial<SupabaseConfig>) => {
  const envConfig = getEnvironmentConfig();
  const config = { ...envConfig, ...customConfig };
  
  const client = initializeSupabase(config);
  const api = createApiClient(client);
  
  return {
    client,
    api,
    // Convenience methods
    signIn: api.signIn.bind(api),
    signOut: api.signOut.bind(api),
    query: api.query.bind(api),
    subscribe: api.subscribe.bind(api),
    getConnectionStatus: api.getConnectionStatus.bind(api),
  };
};

// Default export for easy importing
export default setupHarrySchoolApi;