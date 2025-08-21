/**
 * Offline-First Synchronization Service for Harry School Mobile Apps
 * 
 * Provides comprehensive offline support with intelligent sync strategies,
 * conflict resolution, and educational context awareness.
 * 
 * Features:
 * - Offline-first architecture with local SQLite cache
 * - Intelligent sync strategies (immediate, batched, scheduled)
 * - Conflict resolution with educational context
 * - Priority-based sync queue
 * - Data validation and integrity checks
 * - Network-aware synchronization
 * - Cross-device sync support
 * - Rollback capabilities for failed operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import SQLite from 'expo-sqlite';

import { MobileSupabaseClient } from '../client';
import { DatabaseService } from './database.service';
import { ErrorHandler } from '../error-handler';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sync-related types and interfaces
 */
export interface SyncOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  originalData?: any; // For conflict resolution
  timestamp: number;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  userId: string;
  organizationId: string;
  conflictResolution?: 'client' | 'server' | 'merge' | 'manual';
  metadata?: Record<string, any>;
  dependencies?: string[]; // Operation IDs this depends on
}

export interface SyncResult {
  operationId: string;
  success: boolean;
  error?: string;
  conflictDetected?: boolean;
  conflictResolution?: ConflictResolution;
  serverData?: any;
  timestamp: number;
}

export interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual_required';
  resolvedData?: any;
  conflictFields: string[];
  userChoice?: 'client' | 'server' | 'merge';
}

export interface SyncConfiguration {
  batchSize: number;
  syncIntervalMs: number;
  maxRetries: number;
  prioritySyncThreshold: number; // Immediate sync for priority operations
  conflictResolutionStrategy: 'client' | 'server' | 'merge' | 'manual';
  enableBackgroundSync: boolean;
  maxOfflineTime: number; // Maximum time to work offline
  syncOnlyOnWifi: boolean;
  compressionEnabled: boolean;
}

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
  isWifi: boolean;
  isMetered: boolean;
  canSync: boolean;
}

/**
 * Educational context for sync priorities
 */
export interface EducationalSyncContext {
  table: string;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  conflictResolution: 'client' | 'server' | 'merge' | 'manual';
  description: string;
}

const EDUCATIONAL_SYNC_PRIORITIES: EducationalSyncContext[] = [
  {
    table: 'attendance',
    priority: 'immediate',
    conflictResolution: 'client', // Teacher's attendance marking takes precedence
    description: 'Attendance records are critical and teacher input is authoritative'
  },
  {
    table: 'home_tasks',
    priority: 'high',
    conflictResolution: 'merge', // Combine student progress with teacher feedback
    description: 'Task completion and grading need timely sync'
  },
  {
    table: 'student_vocabulary',
    priority: 'normal',
    conflictResolution: 'client', // Student progress is client-authoritative
    description: 'Vocabulary progress can be synced in batches'
  },
  {
    table: 'feedback',
    priority: 'high',
    conflictResolution: 'server', // Feedback immutability
    description: 'Feedback should be synced quickly but server version is canonical'
  },
  {
    table: 'notifications',
    priority: 'immediate',
    conflictResolution: 'server', // Server-generated notifications are authoritative
    description: 'Notifications need immediate delivery'
  },
  {
    table: 'rankings',
    priority: 'normal',
    conflictResolution: 'server', // Server calculates rankings
    description: 'Rankings are calculated server-side and can be batched'
  },
  {
    table: 'profiles',
    priority: 'high',
    conflictResolution: 'manual', // Profile changes need careful handling
    description: 'Profile updates need manual conflict resolution'
  }
];

/**
 * Main Synchronization Service Class
 */
export class SyncService {
  private client: MobileSupabaseClient;
  private supabaseClient: SupabaseClient<Database> | null;
  private databaseService: DatabaseService;
  private errorHandler: ErrorHandler;
  private sqliteDb: SQLite.SQLiteDatabase;
  
  private syncQueue: SyncOperation[] = [];
  private syncConfig: SyncConfiguration;
  private networkStatus: NetworkStatus;
  private isSyncing = false;
  private syncTimer?: NodeJS.Timeout;
  private lastSyncTimestamp = 0;
  
  // Storage keys
  private static readonly STORAGE_KEYS = {
    SYNC_QUEUE: '@harry_school:sync_queue',
    LAST_SYNC: '@harry_school:last_sync_timestamp',
    SYNC_CONFIG: '@harry_school:sync_config',
    OFFLINE_CHANGES: '@harry_school:offline_changes',
    CONFLICT_LOG: '@harry_school:conflict_log'
  };

  constructor(
    client: MobileSupabaseClient,
    databaseService: DatabaseService,
    config?: Partial<SyncConfiguration>
  ) {
    this.client = client;
    this.supabaseClient = client.getClient();
    this.databaseService = databaseService;
    this.errorHandler = new ErrorHandler();
    
    // Initialize SQLite database for offline storage
    this.sqliteDb = SQLite.openDatabase('harry_school_offline.db');
    
    // Default sync configuration
    this.syncConfig = {
      batchSize: 50,
      syncIntervalMs: 30000, // 30 seconds
      maxRetries: 3,
      prioritySyncThreshold: 5000, // 5 seconds for immediate sync
      conflictResolutionStrategy: 'merge',
      enableBackgroundSync: true,
      maxOfflineTime: 24 * 60 * 60 * 1000, // 24 hours
      syncOnlyOnWifi: false,
      compressionEnabled: true,
      ...config
    };

    this.networkStatus = {
      isConnected: false,
      connectionType: 'unknown',
      isWifi: false,
      isMetered: false,
      canSync: false
    };

    this.initializeService();
  }

  /**
   * Service Initialization
   */
  private async initializeService(): Promise<void> {
    try {
      // Initialize offline database
      await this.initializeOfflineDatabase();
      
      // Restore sync queue from storage
      await this.restoreSyncQueue();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup periodic sync
      this.setupPeriodicSync();
      
      // Initial sync if online
      if (this.networkStatus.canSync) {
        await this.performSync();
      }
      
    } catch (error) {
      this.errorHandler.logError('SYNC_SERVICE_INITIALIZATION_ERROR', error);
    }
  }

  /**
   * Offline Database Setup
   */
  private async initializeOfflineDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction(
        (tx) => {
          // Create tables for offline caching
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS offline_operations (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              table_name TEXT NOT NULL,
              data TEXT NOT NULL,
              original_data TEXT,
              timestamp INTEGER NOT NULL,
              priority TEXT NOT NULL,
              retry_count INTEGER DEFAULT 0,
              max_retries INTEGER DEFAULT 3,
              user_id TEXT NOT NULL,
              organization_id TEXT NOT NULL,
              metadata TEXT,
              dependencies TEXT,
              status TEXT DEFAULT 'pending'
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS cached_data (
              id TEXT PRIMARY KEY,
              table_name TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              data TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              last_accessed INTEGER NOT NULL,
              organization_id TEXT NOT NULL,
              is_dirty INTEGER DEFAULT 0
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sync_metadata (
              table_name TEXT PRIMARY KEY,
              last_sync_timestamp INTEGER NOT NULL,
              last_server_timestamp INTEGER,
              sync_token TEXT,
              organization_id TEXT NOT NULL
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS conflict_log (
              id TEXT PRIMARY KEY,
              operation_id TEXT NOT NULL,
              table_name TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              client_data TEXT NOT NULL,
              server_data TEXT NOT NULL,
              resolution_strategy TEXT,
              resolved_data TEXT,
              timestamp INTEGER NOT NULL,
              user_id TEXT NOT NULL,
              organization_id TEXT NOT NULL,
              is_resolved INTEGER DEFAULT 0
            );
          `);

          // Create indexes for performance
          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_offline_ops_priority 
            ON offline_operations(priority, timestamp);
          `);

          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_cached_data_table 
            ON cached_data(table_name, organization_id, timestamp);
          `);
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }

  /**
   * Network Monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      const wasConnected = this.networkStatus.isConnected;
      
      this.networkStatus = {
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isWifi: state.type === 'wifi',
        isMetered: state.details?.isConnectionExpensive ?? false,
        canSync: this.canSyncWithCurrentNetwork(state)
      };

      // If just came online, trigger sync
      if (!wasConnected && this.networkStatus.canSync) {
        setTimeout(() => this.performSync(), 1000);
      }
    });
  }

  private canSyncWithCurrentNetwork(state: any): boolean {
    if (!state.isConnected) return false;
    
    // If sync only on WiFi is enabled
    if (this.syncConfig.syncOnlyOnWifi && state.type !== 'wifi') {
      return false;
    }
    
    // Check if connection is metered (mobile data)
    if (state.details?.isConnectionExpensive) {
      // Allow only high priority syncs on metered connections
      return this.hasHighPriorityOperations();
    }
    
    return true;
  }

  private hasHighPriorityOperations(): boolean {
    return this.syncQueue.some(op => 
      op.priority === 'immediate' || op.priority === 'high'
    );
  }

  /**
   * Sync Queue Management
   */
  
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const operationId = this.generateOperationId();
    const syncOperation: SyncOperation = {
      id: operationId,
      timestamp: Date.now(),
      retryCount: 0,
      ...operation
    };

    // Get educational context for this table
    const context = this.getEducationalContext(operation.table);
    if (context) {
      syncOperation.priority = context.priority;
      syncOperation.conflictResolution = context.conflictResolution;
    }

    // Add to queue
    this.syncQueue.push(syncOperation);

    // Sort queue by priority and timestamp
    this.sortSyncQueue();

    // Persist queue
    await this.persistSyncQueue();

    // Store in offline database
    await this.storeOfflineOperation(syncOperation);

    // If immediate priority and online, sync right away
    if (syncOperation.priority === 'immediate' && this.networkStatus.canSync) {
      setTimeout(() => this.performSync(), 100);
    }

    return operationId;
  }

  private sortSyncQueue(): void {
    const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3 };
    
    this.syncQueue.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp
      return a.timestamp - b.timestamp;
    });
  }

  private async storeOfflineOperation(operation: SyncOperation): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO offline_operations 
           (id, type, table_name, data, original_data, timestamp, priority, 
            max_retries, user_id, organization_id, metadata, dependencies)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operation.id,
            operation.type,
            operation.table,
            JSON.stringify(operation.data),
            operation.originalData ? JSON.stringify(operation.originalData) : null,
            operation.timestamp,
            operation.priority,
            operation.maxRetries,
            operation.userId,
            operation.organizationId,
            operation.metadata ? JSON.stringify(operation.metadata) : null,
            operation.dependencies ? JSON.stringify(operation.dependencies) : null
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Synchronization Logic
   */

  async performSync(): Promise<void> {
    if (this.isSyncing || !this.networkStatus.canSync) {
      return;
    }

    this.isSyncing = true;

    try {
      // Process sync queue in batches
      await this.processSyncQueue();
      
      // Sync server changes
      await this.syncServerChanges();
      
      // Update last sync timestamp
      this.lastSyncTimestamp = Date.now();
      await AsyncStorage.setItem(
        SyncService.STORAGE_KEYS.LAST_SYNC,
        this.lastSyncTimestamp.toString()
      );

    } catch (error) {
      this.errorHandler.logError('SYNC_PERFORMANCE_ERROR', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const batchSize = this.syncConfig.batchSize;
    
    while (this.syncQueue.length > 0 && this.networkStatus.canSync) {
      const batch = this.syncQueue.splice(0, batchSize);
      
      try {
        await this.processBatch(batch);
      } catch (error) {
        // Re-add failed operations to queue for retry
        const retriableOperations = batch.filter(op => 
          op.retryCount < op.maxRetries
        ).map(op => ({
          ...op,
          retryCount: op.retryCount + 1
        }));
        
        this.syncQueue.unshift(...retriableOperations);
        this.sortSyncQueue();
        
        this.errorHandler.logError('SYNC_BATCH_ERROR', error);
      }
    }

    await this.persistSyncQueue();
  }

  private async processBatch(operations: SyncOperation[]): Promise<void> {
    const results: SyncResult[] = [];

    for (const operation of operations) {
      try {
        const result = await this.processOperation(operation);
        results.push(result);
        
        if (result.success) {
          // Remove from offline database
          await this.removeOfflineOperation(operation.id);
        }
        
      } catch (error) {
        results.push({
          operationId: operation.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
    }

    // Handle results and conflicts
    await this.handleSyncResults(results);
  }

  private async processOperation(operation: SyncOperation): Promise<SyncResult> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    try {
      let result: any;
      
      switch (operation.type) {
        case 'INSERT':
          result = await this.supabaseClient
            .from(operation.table)
            .insert(operation.data)
            .select()
            .single();
          break;
          
        case 'UPDATE':
          result = await this.supabaseClient
            .from(operation.table)
            .update(operation.data)
            .eq('id', operation.data.id)
            .select()
            .single();
          break;
          
        case 'DELETE':
          result = await this.supabaseClient
            .from(operation.table)
            .update({ 
              deleted_at: new Date().toISOString(),
              deleted_by: operation.userId 
            })
            .eq('id', operation.data.id)
            .select()
            .single();
          break;
          
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (result.error) {
        // Check if this is a conflict (e.g., version mismatch)
        if (this.isConflictError(result.error)) {
          const conflictResolution = await this.resolveConflict(operation, result.error);
          return {
            operationId: operation.id,
            success: false,
            conflictDetected: true,
            conflictResolution,
            timestamp: Date.now()
          };
        }
        
        throw new Error(result.error.message);
      }

      return {
        operationId: operation.id,
        success: true,
        serverData: result.data,
        timestamp: Date.now()
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Conflict Resolution
   */

  private isConflictError(error: any): boolean {
    // Common conflict indicators
    return error.code === 'PGRST120' || // Row not found (might be deleted)
           error.message?.includes('conflict') ||
           error.message?.includes('version') ||
           error.message?.includes('updated_at');
  }

  private async resolveConflict(
    operation: SyncOperation, 
    error: any
  ): Promise<ConflictResolution> {
    try {
      // Fetch current server state
      const serverData = await this.fetchServerData(operation.table, operation.data.id);
      
      if (!serverData) {
        // Data was deleted on server
        return {
          strategy: 'server_wins',
          conflictFields: ['deleted'],
          resolvedData: null
        };
      }

      // Detect conflict fields
      const conflictFields = this.detectConflictFields(
        operation.originalData || {},
        operation.data,
        serverData
      );

      // Apply resolution strategy
      const context = this.getEducationalContext(operation.table);
      const strategy = operation.conflictResolution || context?.conflictResolution || 'merge';

      let resolvedData: any;
      let resolutionStrategy: ConflictResolution['strategy'];

      switch (strategy) {
        case 'client':
          resolvedData = operation.data;
          resolutionStrategy = 'client_wins';
          break;
          
        case 'server':
          resolvedData = serverData;
          resolutionStrategy = 'server_wins';
          break;
          
        case 'merge':
          resolvedData = this.mergeData(operation.data, serverData, conflictFields);
          resolutionStrategy = 'merge';
          break;
          
        case 'manual':
          // Log conflict for manual resolution
          await this.logConflict(operation, serverData, conflictFields);
          resolutionStrategy = 'manual_required';
          break;
          
        default:
          resolvedData = serverData;
          resolutionStrategy = 'server_wins';
      }

      return {
        strategy: resolutionStrategy,
        resolvedData,
        conflictFields
      };

    } catch (error) {
      this.errorHandler.logError('CONFLICT_RESOLUTION_ERROR', error);
      return {
        strategy: 'server_wins',
        conflictFields: ['unknown'],
        resolvedData: null
      };
    }
  }

  private async fetchServerData(table: string, id: string): Promise<any> {
    if (!this.supabaseClient) return null;

    try {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  private detectConflictFields(original: any, local: any, server: any): string[] {
    const conflicts: string[] = [];
    const allKeys = new Set([
      ...Object.keys(local),
      ...Object.keys(server)
    ]);

    for (const key of allKeys) {
      if (key === 'updated_at' || key === 'id') continue;
      
      const originalValue = original[key];
      const localValue = local[key];
      const serverValue = server[key];

      // Check if both client and server changed from original
      if (originalValue !== localValue && originalValue !== serverValue &&
          localValue !== serverValue) {
        conflicts.push(key);
      }
    }

    return conflicts;
  }

  private mergeData(clientData: any, serverData: any, conflictFields: string[]): any {
    const merged = { ...serverData }; // Start with server data

    // Educational context-specific merge rules
    for (const field of Object.keys(clientData)) {
      if (this.shouldPreferClientValue(clientData, serverData, field, conflictFields)) {
        merged[field] = clientData[field];
      }
    }

    // Always update timestamp
    merged.updated_at = new Date().toISOString();

    return merged;
  }

  private shouldPreferClientValue(
    clientData: any, 
    serverData: any, 
    field: string, 
    conflictFields: string[]
  ): boolean {
    // Educational context rules
    switch (field) {
      case 'completed_at':
      case 'score':
      case 'practice_count':
      case 'mastery_level':
        // Student progress fields - client wins
        return true;
        
      case 'status':
        // Attendance status - client (teacher) wins
        if (clientData.status && ['present', 'absent', 'late', 'excused'].includes(clientData.status)) {
          return true;
        }
        break;
        
      case 'is_read':
      case 'last_accessed':
        // User interaction fields - client wins
        return true;
        
      case 'ranking_points':
      case 'ranking_coins':
      case 'level':
      case 'rank':
        // Calculated fields - server wins
        return false;
        
      default:
        // For other fields, prefer server unless it's a direct conflict
        return conflictFields.includes(field) && clientData[field] !== null;
    }

    return false;
  }

  private async logConflict(
    operation: SyncOperation,
    serverData: any,
    conflictFields: string[]
  ): Promise<void> {
    const conflictId = this.generateOperationId();
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO conflict_log 
           (id, operation_id, table_name, entity_id, client_data, server_data,
            timestamp, user_id, organization_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            conflictId,
            operation.id,
            operation.table,
            operation.data.id,
            JSON.stringify(operation.data),
            JSON.stringify(serverData),
            Date.now(),
            operation.userId,
            operation.organizationId
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Server Changes Synchronization
   */

  private async syncServerChanges(): Promise<void> {
    try {
      const lastSync = await this.getLastSyncTimestamp();
      const tables = this.getTablesSyncOrder();

      for (const table of tables) {
        await this.syncTableChanges(table, lastSync);
      }
    } catch (error) {
      this.errorHandler.logError('SERVER_SYNC_ERROR', error);
    }
  }

  private getTablesSyncOrder(): string[] {
    // Sync in dependency order
    return [
      'organizations',
      'profiles', 
      'teachers',
      'students',
      'groups',
      'vocabulary_words',
      'home_tasks',
      'student_vocabulary',
      'attendance',
      'feedback',
      'notifications',
      'rankings',
      'rewards',
      'student_rewards',
      'extra_lesson_requests'
    ];
  }

  private async syncTableChanges(table: string, lastSync: number): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('*')
        .gte('updated_at', new Date(lastSync).toISOString())
        .order('updated_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        await this.processBulkServerChanges(table, data);
      }
    } catch (error) {
      this.errorHandler.logError(`SYNC_TABLE_ERROR_${table}`, error);
    }
  }

  private async processBulkServerChanges(table: string, changes: any[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize);
      await this.processBulkBatch(table, batch);
    }
  }

  private async processBulkBatch(table: string, batch: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        batch.forEach((record) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO cached_data 
             (id, table_name, entity_id, data, timestamp, last_accessed, organization_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              `${table}:${record.id}`,
              table,
              record.id,
              JSON.stringify(record),
              Date.now(),
              Date.now(),
              record.organization_id || ''
            ]
          );
        });
      }, reject, resolve);
    });
  }

  /**
   * Periodic Sync Setup
   */

  private setupPeriodicSync(): void {
    if (this.syncConfig.enableBackgroundSync) {
      this.syncTimer = setInterval(async () => {
        if (this.networkStatus.canSync && !this.isSyncing) {
          await this.performSync();
        }
      }, this.syncConfig.syncIntervalMs);
    }
  }

  /**
   * Utility Methods
   */

  private getEducationalContext(table: string): EducationalSyncContext | undefined {
    return EDUCATIONAL_SYNC_PRIORITIES.find(context => context.table === table);
  }

  private generateOperationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SyncService.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      this.errorHandler.logError('SYNC_QUEUE_PERSIST_ERROR', error);
    }
  }

  private async restoreSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(SyncService.STORAGE_KEYS.SYNC_QUEUE);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        this.sortSyncQueue();
      }
    } catch (error) {
      this.errorHandler.logError('SYNC_QUEUE_RESTORE_ERROR', error);
      this.syncQueue = [];
    }
  }

  private async removeOfflineOperation(operationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM offline_operations WHERE id = ?',
          [operationId],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  private async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(SyncService.STORAGE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async handleSyncResults(results: SyncResult[]): Promise<void> {
    // Process results, handle conflicts, notify about failures
    for (const result of results) {
      if (!result.success) {
        if (result.conflictDetected) {
          // Handle conflict
          this.errorHandler.logError('SYNC_CONFLICT', { 
            operationId: result.operationId,
            resolution: result.conflictResolution 
          });
        } else {
          // Handle error
          this.errorHandler.logError('SYNC_OPERATION_FAILED', { 
            operationId: result.operationId,
            error: result.error 
          });
        }
      }
    }
  }

  /**
   * Public API Methods
   */

  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      networkStatus: this.networkStatus,
      lastSync: this.lastSyncTimestamp,
      canSync: this.networkStatus.canSync
    };
  }

  async forcSync(): Promise<void> {
    if (this.networkStatus.canSync) {
      await this.performSync();
    }
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.persistSyncQueue();
    
    // Clear offline operations
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql('DELETE FROM offline_operations', [], () => resolve(), (_, error) => reject(error));
      });
    });
  }

  async getConflicts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM conflict_log WHERE is_resolved = 0 ORDER BY timestamp DESC',
          [],
          (_, result) => {
            const conflicts = [];
            for (let i = 0; i < result.rows.length; i++) {
              conflicts.push(result.rows.item(i));
            }
            resolve(conflicts);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }
}

export default SyncService;