import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { Database } from '../types/database';
import { OfflineQueue } from './offline-queue';
import { ErrorHandler } from './error-handler';
import { SecurityManager } from './security';
import { PerformanceManager } from './performance';
import CacheManager from './cache';
import RealtimeService from './services/realtime.service';
import StorageService from './services/storage.service';
import type { 
  SupabaseConfig, 
  SupabaseResponse, 
  SupabasePaginatedResponse,
  ConnectionStatus,
  RetryOptions 
} from '../types/supabase';

/**
 * Mobile-optimized Supabase client with offline support, connection retry,
 * and enhanced error handling for Harry School mobile apps
 */
class MobileSupabaseClient {
  private client: SupabaseClient<Database> | null = null;
  private offlineQueue: OfflineQueue;
  private errorHandler: ErrorHandler;
  private securityManager: SecurityManager;
  private performanceManager: PerformanceManager;
  private cacheManager: CacheManager;
  private realtimeService: RealtimeService | null = null;
  private storageService: StorageService | null = null;
  private connectionStatus: ConnectionStatus = 'connecting';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private sessionRefreshInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(private config: SupabaseConfig) {
    this.offlineQueue = new OfflineQueue();
    this.errorHandler = new ErrorHandler();
    this.securityManager = new SecurityManager();
    this.performanceManager = new PerformanceManager();
    this.cacheManager = new CacheManager();
    this.initializeClient();
    this.setupAppStateHandling();
    this.setupHealthCheck();
  }

  private async initializeClient(): Promise<void> {
    try {
      const { supabaseUrl, supabaseAnonKey } = await this.securityManager.getSecureConfig();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing required Supabase configuration');
      }

      this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Use AsyncStorage for token persistence
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false, // Not applicable for mobile
          // Custom session refresh handling
          storageKey: '@harry-school:auth-token',
        },
        realtime: {
          // Mobile-optimized realtime settings
          params: {
            eventsPerSecond: 5, // Limit for mobile bandwidth
          },
          heartbeatIntervalMs: 30000, // 30 seconds for mobile
          reconnectAfterMs: (tries: number) => {
            return Math.min(tries * 1000, 10000); // Exponential backoff up to 10s
          },
        },
        global: {
          headers: {
            'X-Client-Info': `harry-school-mobile/${Platform.OS}/${Platform.Version}`,
            'X-App-Version': this.config.appVersion || '1.0.0',
          },
        },
        // Mobile network optimization
        db: {
          schema: 'public',
        },
      });

      // Set up authentication event handlers
      this.client.auth.onAuthStateChange(async (event, session) => {
        await this.handleAuthStateChange(event, session);
      });

      // Test connection
      await this.testConnection();
      
      // Initialize services after client is ready
      this.realtimeService = new RealtimeService(this);
      this.storageService = new StorageService(this);
      
      this.updateConnectionStatus('connected');
      this.resetReconnectAttempts();

    } catch (error) {
      this.errorHandler.logError('CLIENT_INIT_ERROR', error);
      this.updateConnectionStatus('disconnected');
      await this.scheduleReconnect();
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');
    
    const { error } = await this.client
      .from('organizations')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
  }

  private async handleAuthStateChange(event: string, session: any): Promise<void> {
    switch (event) {
      case 'SIGNED_IN':
        this.securityManager.onSignIn(session);
        await this.offlineQueue.processQueue(this.client!);
        this.setupSessionRefresh();
        break;
      case 'SIGNED_OUT':
        this.securityManager.onSignOut();
        await this.offlineQueue.clearQueue();
        this.clearSessionRefresh();
        break;
      case 'TOKEN_REFRESHED':
        this.securityManager.onTokenRefresh(session);
        break;
      case 'PASSWORD_RECOVERY':
        // Handle password recovery in mobile context
        break;
    }
  }

  private setupAppStateHandling(): void {
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active - reconnect if needed
        if (this.connectionStatus === 'disconnected') {
          await this.reconnect();
        }
        // Process offline queue
        if (this.client && this.connectionStatus === 'connected') {
          await this.offlineQueue.processQueue(this.client);
        }
      } else if (nextAppState === 'background') {
        // App went to background - reduce activity
        this.clearHealthCheck();
      }
    });
  }

  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (AppState.currentState === 'active') {
        await this.performHealthCheck();
      }
    }, 60000); // Check every minute when app is active
  }

  private clearHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private setupSessionRefresh(): void {
    // Proactive session refresh 5 minutes before expiry
    this.sessionRefreshInterval = setInterval(async () => {
      if (this.client?.auth.session) {
        const { error } = await this.client.auth.refreshSession();
        if (error) {
          this.errorHandler.logError('SESSION_REFRESH_ERROR', error);
        }
      }
    }, 25 * 60 * 1000); // Every 25 minutes
  }

  private clearSessionRefresh(): void {
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      await this.testConnection();
      if (this.connectionStatus !== 'connected') {
        this.updateConnectionStatus('connected');
        this.resetReconnectAttempts();
      }
    } catch (error) {
      if (this.connectionStatus === 'connected') {
        this.updateConnectionStatus('disconnected');
        await this.scheduleReconnect();
      }
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus('failed');
      return;
    }

    this.updateConnectionStatus('reconnecting');
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectDelay
    );

    setTimeout(async () => {
      this.reconnectAttempts++;
      await this.reconnect();
    }, delay);
  }

  private async reconnect(): Promise<void> {
    try {
      await this.initializeClient();
    } catch (error) {
      this.errorHandler.logError('RECONNECTION_ERROR', error);
      await this.scheduleReconnect();
    }
  }

  private resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.listeners.forEach(listener => listener(status));
  }

  // Public API methods

  public getClient(): SupabaseClient<Database> | null {
    return this.client;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  public getSecurityManager(): SecurityManager {
    return this.securityManager;
  }

  public getPerformanceManager(): PerformanceManager {
    return this.performanceManager;
  }

  public getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  public getRealtimeService(): RealtimeService | null {
    return this.realtimeService;
  }

  public getStorageService(): StorageService | null {
    return this.storageService;
  }

  public getOfflineQueue(): OfflineQueue {
    return this.offlineQueue;
  }

  public async query<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<SupabaseResponse<T>>,
    retryOptions?: RetryOptions
  ): Promise<SupabaseResponse<T>> {
    if (!this.client) {
      const error = new Error('Supabase client not available');
      this.errorHandler.logError('CLIENT_UNAVAILABLE', error);
      return { data: null, error: { message: 'Database connection not available' } };
    }

    if (this.connectionStatus === 'disconnected') {
      // Queue for offline processing
      const queueId = await this.offlineQueue.enqueue(queryFn);
      return { 
        data: null, 
        error: { message: 'Operation queued for when connection is restored' },
        meta: { queueId }
      } as any;
    }

    try {
      const result = await this.executeWithRetry(queryFn, retryOptions);
      return result;
    } catch (error) {
      this.errorHandler.logError('QUERY_ERROR', error);
      return { 
        data: null, 
        error: { message: this.errorHandler.getErrorMessage(error) } 
      };
    }
  }

  private async executeWithRetry<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<SupabaseResponse<T>>,
    options?: RetryOptions
  ): Promise<SupabaseResponse<T>> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 5000 } = options || {};
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn(this.client!);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        // Check if error is retryable
        if (!this.errorHandler.isRetryableError(error)) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  public async signIn(email: string, password: string): Promise<SupabaseResponse<any>> {
    if (!this.client) {
      return { data: null, error: { message: 'Client not available' } };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        this.errorHandler.logError('SIGNIN_ERROR', error);
        return { data: null, error: { message: this.errorHandler.getErrorMessage(error) } };
      }
      
      return { data, error: null };
    } catch (error) {
      this.errorHandler.logError('SIGNIN_EXCEPTION', error);
      return { data: null, error: { message: 'Sign in failed' } };
    }
  }

  public async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  public async getSession(): Promise<any> {
    if (!this.client) return null;
    
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  public async getUser(): Promise<any> {
    if (!this.client) return null;
    
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  // Cleanup method
  public cleanup(): void {
    this.clearHealthCheck();
    this.clearSessionRefresh();
    this.listeners.clear();
    this.offlineQueue.cleanup();
    this.performanceManager?.cleanup();
    this.cacheManager?.cleanup();
    this.realtimeService?.cleanup();
    this.storageService?.cleanup();
    this.securityManager?.cleanup();
    this.client = null;
  }
}

// Singleton instance
let supabaseInstance: MobileSupabaseClient | null = null;

export const createMobileSupabaseClient = (config: SupabaseConfig): MobileSupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = new MobileSupabaseClient(config);
  }
  return supabaseInstance;
};

export const getMobileSupabaseClient = (): MobileSupabaseClient | null => {
  return supabaseInstance;
};

export { MobileSupabaseClient };
export type { SupabaseConfig, SupabaseResponse, SupabasePaginatedResponse, ConnectionStatus };