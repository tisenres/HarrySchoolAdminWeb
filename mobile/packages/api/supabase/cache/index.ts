/**
 * Comprehensive Caching System for Harry School Mobile Apps
 * 
 * Provides intelligent, multi-layered caching with educational context awareness,
 * performance optimization, and mobile-specific considerations.
 * 
 * Features:
 * - Multi-layer cache architecture (memory, storage, database)
 * - Educational context-aware cache strategies
 * - Intelligent cache invalidation
 * - Background cache warming
 * - Cache analytics and monitoring
 * - Memory pressure handling
 * - Offline-first cache persistence
 * - Query result caching with smart keys
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import LRU from 'lru-cache';
import CryptoJS from 'crypto-js';

import { ErrorHandler } from '../error-handler';
import type { AppEnvironmentConfig } from '../config/environment';

/**
 * Cache-related types and interfaces
 */
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata?: Record<string, any>;
}

export interface CacheOptions {
  useCache?: boolean;
  ttl?: number; // Time to live in milliseconds
  skipMemory?: boolean;
  skipStorage?: boolean;
  skipDatabase?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  tags?: string[]; // For grouped invalidation
  compress?: boolean;
  encrypt?: boolean;
}

export interface CacheConfig {
  // Memory cache settings
  memoryMaxSize: number; // Maximum memory usage in bytes
  memoryMaxEntries: number; // Maximum number of entries
  
  // Storage cache settings
  storageMaxSize: number; // Maximum storage usage in bytes
  storageMaxEntries: number; // Maximum number of entries
  
  // Database cache settings
  databaseMaxSize: number; // Maximum database size in bytes
  databaseMaxEntries: number; // Maximum number of entries
  
  // General settings
  defaultTTL: number; // Default TTL in milliseconds
  compressionThreshold: number; // Compress entries larger than this
  encryptSensitiveData: boolean;
  enableBackgroundCleanup: boolean;
  backgroundCleanupInterval: number; // Milliseconds
  
  // Educational context settings
  studentDataTTL: number;
  teacherDataTTL: number;
  groupDataTTL: number;
  taskDataTTL: number;
  attendanceDataTTL: number;
  rankingDataTTL: number;
  
  // Performance settings
  preloadCriticalData: boolean;
  enableQueryResultCaching: boolean;
  enableSmartPrefetching: boolean;
}

export interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  storageHits: number;
  storageMisses: number;
  databaseHits: number;
  databaseMisses: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
  averageAccessTime: number;
  evictionCount: number;
  compressionRatio: number;
}

/**
 * Educational context cache strategies
 */
export interface EducationalCacheStrategy {
  entity: string;
  defaultTTL: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  invalidationTriggers: string[];
  preloadStrategy?: 'eager' | 'lazy' | 'scheduled';
  compressionEnabled: boolean;
  encryptionRequired: boolean;
  description: string;
}

const EDUCATIONAL_CACHE_STRATEGIES: EducationalCacheStrategy[] = [
  {
    entity: 'student_profile',
    defaultTTL: 1800000, // 30 minutes
    priority: 'high',
    invalidationTriggers: ['profile_update', 'enrollment_change'],
    preloadStrategy: 'eager',
    compressionEnabled: false,
    encryptionRequired: true,
    description: 'Student profile data with PII protection'
  },
  {
    entity: 'teacher_profile', 
    defaultTTL: 3600000, // 1 hour
    priority: 'high',
    invalidationTriggers: ['profile_update', 'group_assignment'],
    preloadStrategy: 'eager',
    compressionEnabled: false,
    encryptionRequired: true,
    description: 'Teacher profile data with PII protection'
  },
  {
    entity: 'student_groups',
    defaultTTL: 1800000, // 30 minutes
    priority: 'critical',
    invalidationTriggers: ['enrollment_change', 'group_update'],
    preloadStrategy: 'eager',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Student group memberships for navigation'
  },
  {
    entity: 'teacher_groups',
    defaultTTL: 1800000, // 30 minutes
    priority: 'critical', 
    invalidationTriggers: ['group_assignment', 'group_update'],
    preloadStrategy: 'eager',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Teacher group assignments for dashboard'
  },
  {
    entity: 'home_tasks',
    defaultTTL: 600000, // 10 minutes
    priority: 'high',
    invalidationTriggers: ['task_update', 'task_completion'],
    preloadStrategy: 'lazy',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Student homework and assignments'
  },
  {
    entity: 'attendance_records',
    defaultTTL: 1800000, // 30 minutes
    priority: 'normal',
    invalidationTriggers: ['attendance_update'],
    preloadStrategy: 'scheduled',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Attendance records for groups'
  },
  {
    entity: 'vocabulary_progress',
    defaultTTL: 900000, // 15 minutes
    priority: 'normal',
    invalidationTriggers: ['vocabulary_practice', 'progress_update'],
    preloadStrategy: 'lazy',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Student vocabulary learning progress'
  },
  {
    entity: 'rankings',
    defaultTTL: 3600000, // 1 hour
    priority: 'low',
    invalidationTriggers: ['ranking_update', 'points_change'],
    preloadStrategy: 'lazy',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Student and teacher rankings/leaderboards'
  },
  {
    entity: 'notifications',
    defaultTTL: 300000, // 5 minutes
    priority: 'critical',
    invalidationTriggers: ['notification_received', 'notification_read'],
    preloadStrategy: 'eager',
    compressionEnabled: false,
    encryptionRequired: false,
    description: 'Real-time notifications'
  },
  {
    entity: 'feedback',
    defaultTTL: 1800000, // 30 minutes
    priority: 'normal',
    invalidationTriggers: ['feedback_submitted', 'feedback_response'],
    preloadStrategy: 'lazy',
    compressionEnabled: true,
    encryptionRequired: false,
    description: 'Feedback between teachers and students'
  }
];

/**
 * Main Cache Manager Class
 */
export class CacheManager {
  private config: CacheConfig;
  private errorHandler: ErrorHandler;
  
  // Multi-layer cache storage
  private memoryCache: LRU<string, CacheEntry>;
  private sqliteDb: SQLite.SQLiteDatabase;
  
  // Cache statistics
  private stats: CacheStats;
  
  // Background cleanup
  private cleanupTimer?: NodeJS.Timeout;
  private warmupTimer?: NodeJS.Timeout;
  
  // Memory pressure handling
  private memoryPressureThreshold = 0.8; // 80% of max memory
  private lastMemoryCheck = 0;
  
  // Encryption key for sensitive data
  private encryptionKey: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.errorHandler = new ErrorHandler();
    this.encryptionKey = this.generateEncryptionKey();
    
    // Default configuration
    this.config = {
      // Memory settings (5MB for memory cache)
      memoryMaxSize: 5 * 1024 * 1024,
      memoryMaxEntries: 1000,
      
      // Storage settings (20MB for AsyncStorage)
      storageMaxSize: 20 * 1024 * 1024,
      storageMaxEntries: 5000,
      
      // Database settings (100MB for SQLite)
      databaseMaxSize: 100 * 1024 * 1024,
      databaseMaxEntries: 50000,
      
      // General settings
      defaultTTL: 1800000, // 30 minutes
      compressionThreshold: 1024, // 1KB
      encryptSensitiveData: true,
      enableBackgroundCleanup: true,
      backgroundCleanupInterval: 300000, // 5 minutes
      
      // Educational context TTLs
      studentDataTTL: 1800000, // 30 minutes
      teacherDataTTL: 3600000, // 1 hour  
      groupDataTTL: 1800000, // 30 minutes
      taskDataTTL: 600000, // 10 minutes
      attendanceDataTTL: 1800000, // 30 minutes
      rankingDataTTL: 3600000, // 1 hour
      
      // Performance settings
      preloadCriticalData: true,
      enableQueryResultCaching: true,
      enableSmartPrefetching: true,
      
      ...config
    };

    this.initializeMemoryCache();
    this.initializeDatabaseCache();
    this.initializeStats();
    this.setupBackgroundTasks();
  }

  /**
   * Cache Initialization
   */

  private initializeMemoryCache(): void {
    this.memoryCache = new LRU({
      max: this.config.memoryMaxEntries,
      maxSize: this.config.memoryMaxSize,
      sizeCalculation: (value: CacheEntry) => value.size,
      ttl: this.config.defaultTTL,
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      dispose: (value: CacheEntry, key: string) => {
        this.stats.evictionCount++;
        this.errorHandler.logError('CACHE_EVICTION', { key, size: value.size });
      }
    });
  }

  private async initializeDatabaseCache(): Promise<void> {
    try {
      this.sqliteDb = SQLite.openDatabase('harry_school_cache.db');
      
      await this.executeSqlAsync(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          access_count INTEGER DEFAULT 0,
          last_accessed INTEGER NOT NULL,
          size INTEGER NOT NULL,
          compressed INTEGER DEFAULT 0,
          encrypted INTEGER DEFAULT 0,
          tags TEXT,
          metadata TEXT
        );
      `);

      await this.executeSqlAsync(`
        CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache_entries(timestamp);
      `);

      await this.executeSqlAsync(`
        CREATE INDEX IF NOT EXISTS idx_cache_ttl ON cache_entries(timestamp + ttl);
      `);

      await this.executeSqlAsync(`
        CREATE INDEX IF NOT EXISTS idx_cache_tags ON cache_entries(tags);
      `);

      // Initial cleanup of expired entries
      await this.cleanupExpiredEntries();
      
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_INIT_ERROR', error);
    }
  }

  private initializeStats(): void {
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      storageHits: 0,
      storageMisses: 0,
      databaseHits: 0,
      databaseMisses: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      averageAccessTime: 0,
      evictionCount: 0,
      compressionRatio: 0
    };
  }

  private setupBackgroundTasks(): void {
    if (this.config.enableBackgroundCleanup) {
      this.cleanupTimer = setInterval(
        () => this.performBackgroundCleanup(),
        this.config.backgroundCleanupInterval
      );
    }

    if (this.config.preloadCriticalData) {
      this.warmupTimer = setInterval(
        () => this.performCacheWarmup(),
        600000 // Every 10 minutes
      );
    }
  }

  /**
   * Core Cache Operations
   */

  async get<T = any>(
    key: string, 
    options?: CacheOptions
  ): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Check memory cache first
      if (!options?.skipMemory) {
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && this.isEntryValid(memoryEntry)) {
          this.stats.memoryHits++;
          this.updateAccessStats(memoryEntry);
          return memoryEntry.data as T;
        } else {
          this.stats.memoryMisses++;
        }
      }

      // Check storage cache
      if (!options?.skipStorage) {
        const storageEntry = await this.getFromStorage(key);
        if (storageEntry && this.isEntryValid(storageEntry)) {
          this.stats.storageHits++;
          
          // Promote to memory cache
          if (!options?.skipMemory) {
            this.memoryCache.set(key, storageEntry);
          }
          
          this.updateAccessStats(storageEntry);
          return storageEntry.data as T;
        } else {
          this.stats.storageMisses++;
        }
      }

      // Check database cache
      if (!options?.skipDatabase) {
        const dbEntry = await this.getFromDatabase(key);
        if (dbEntry && this.isEntryValid(dbEntry)) {
          this.stats.databaseHits++;
          
          // Promote to higher cache layers
          if (!options?.skipStorage) {
            await this.setInStorage(key, dbEntry);
          }
          if (!options?.skipMemory) {
            this.memoryCache.set(key, dbEntry);
          }
          
          this.updateAccessStats(dbEntry);
          return dbEntry.data as T;
        } else {
          this.stats.databaseMisses++;
        }
      }

      return null;
      
    } catch (error) {
      this.errorHandler.logError('CACHE_GET_ERROR', error);
      return null;
    } finally {
      // Update performance stats
      const accessTime = Date.now() - startTime;
      this.updatePerformanceStats(accessTime);
    }
  }

  async set<T = any>(
    key: string,
    data: T,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const strategy = this.getEducationalStrategy(key);
      const ttl = options?.ttl || strategy?.defaultTTL || this.config.defaultTTL;
      const priority = options?.priority || strategy?.priority || 'normal';
      
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(data),
        metadata: {
          priority,
          tags: options?.tags || [],
          compressed: false,
          encrypted: false,
          strategy: strategy?.entity
        }
      };

      // Compress if needed
      if (this.shouldCompress(entry, options)) {
        entry.data = this.compressData(entry.data) as T;
        entry.metadata!.compressed = true;
      }

      // Encrypt if needed
      if (this.shouldEncrypt(entry, options)) {
        entry.data = this.encryptData(entry.data) as T;
        entry.metadata!.encrypted = true;
      }

      // Update size after compression/encryption
      entry.size = this.calculateSize(entry.data);

      // Store in appropriate cache layers based on priority and size
      if (priority === 'critical' || entry.size < 10240) { // < 10KB
        if (!options?.skipMemory) {
          await this.handleMemoryPressure();
          this.memoryCache.set(key, entry);
        }
      }

      if (priority !== 'low') {
        if (!options?.skipStorage) {
          await this.setInStorage(key, entry);
        }
      }

      if (!options?.skipDatabase) {
        await this.setInDatabase(key, entry);
      }

      this.updateCacheStats(entry, 'set');
      
    } catch (error) {
      this.errorHandler.logError('CACHE_SET_ERROR', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Remove from all cache layers
      this.memoryCache.delete(key);
      await this.deleteFromStorage(key);
      await this.deleteFromDatabase(key);
      
    } catch (error) {
      this.errorHandler.logError('CACHE_DELETE_ERROR', error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear all cache layers
      this.memoryCache.clear();
      await this.clearStorage();
      await this.clearDatabase();
      
      // Reset stats
      this.initializeStats();
      
    } catch (error) {
      this.errorHandler.logError('CACHE_CLEAR_ERROR', error);
    }
  }

  /**
   * Educational Context Methods
   */

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Invalidate in memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.metadata?.tags && this.hasMatchingTag(entry.metadata.tags, tags)) {
          this.memoryCache.delete(key);
        }
      }

      // Invalidate in database
      const placeholders = tags.map(() => '?').join(',');
      await this.executeSqlAsync(
        `DELETE FROM cache_entries WHERE tags IN (${placeholders})`,
        tags
      );

      // Invalidate in storage (requires scanning, so we do it in background)
      setTimeout(() => this.invalidateStorageByTags(tags), 0);
      
    } catch (error) {
      this.errorHandler.logError('CACHE_TAG_INVALIDATION_ERROR', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Convert pattern to regex (simple * to .* conversion)
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(regexPattern);

      // Invalidate in memory cache
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }

      // Invalidate in database using LIKE pattern
      const sqlPattern = pattern.replace(/\*/g, '%');
      await this.executeSqlAsync(
        'DELETE FROM cache_entries WHERE key LIKE ?',
        [sqlPattern]
      );

      // Invalidate in storage
      setTimeout(() => this.invalidateStorageByPattern(regex), 0);
      
    } catch (error) {
      this.errorHandler.logError('CACHE_PATTERN_INVALIDATION_ERROR', error);
    }
  }

  /**
   * Storage Layer Operations
   */

  private async getFromStorage(key: string): Promise<CacheEntry | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const data = await AsyncStorage.getItem(storageKey);
      
      if (data) {
        const entry = JSON.parse(data) as CacheEntry;
        
        // Decrypt if needed
        if (entry.metadata?.encrypted) {
          entry.data = this.decryptData(entry.data);
        }
        
        // Decompress if needed
        if (entry.metadata?.compressed) {
          entry.data = this.decompressData(entry.data);
        }
        
        return entry;
      }
      
      return null;
    } catch (error) {
      this.errorHandler.logError('CACHE_STORAGE_GET_ERROR', error);
      return null;
    }
  }

  private async setInStorage(key: string, entry: CacheEntry): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      const data = JSON.stringify(entry);
      await AsyncStorage.setItem(storageKey, data);
    } catch (error) {
      this.errorHandler.logError('CACHE_STORAGE_SET_ERROR', error);
    }
  }

  private async deleteFromStorage(key: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      this.errorHandler.logError('CACHE_STORAGE_DELETE_ERROR', error);
    }
  }

  private async clearStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@harry_cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      this.errorHandler.logError('CACHE_STORAGE_CLEAR_ERROR', error);
    }
  }

  /**
   * Database Layer Operations
   */

  private async getFromDatabase(key: string): Promise<CacheEntry | null> {
    try {
      const result = await this.querySqlAsync(
        'SELECT * FROM cache_entries WHERE key = ? LIMIT 1',
        [key]
      );

      if (result.rows.length > 0) {
        const row = result.rows.item(0);
        const entry: CacheEntry = {
          key: row.key,
          data: JSON.parse(row.data),
          timestamp: row.timestamp,
          ttl: row.ttl,
          accessCount: row.access_count,
          lastAccessed: row.last_accessed,
          size: row.size,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };

        // Decrypt if needed
        if (row.encrypted) {
          entry.data = this.decryptData(entry.data);
        }
        
        // Decompress if needed
        if (row.compressed) {
          entry.data = this.decompressData(entry.data);
        }

        // Update access count
        this.executeSqlAsync(
          'UPDATE cache_entries SET access_count = ?, last_accessed = ? WHERE key = ?',
          [entry.accessCount + 1, Date.now(), key]
        );

        return entry;
      }
      
      return null;
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_GET_ERROR', error);
      return null;
    }
  }

  private async setInDatabase(key: string, entry: CacheEntry): Promise<void> {
    try {
      const compressed = entry.metadata?.compressed ? 1 : 0;
      const encrypted = entry.metadata?.encrypted ? 1 : 0;
      const tags = entry.metadata?.tags ? JSON.stringify(entry.metadata.tags) : null;
      const metadata = entry.metadata ? JSON.stringify(entry.metadata) : null;

      await this.executeSqlAsync(
        `INSERT OR REPLACE INTO cache_entries 
         (key, data, timestamp, ttl, access_count, last_accessed, size, 
          compressed, encrypted, tags, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          key,
          JSON.stringify(entry.data),
          entry.timestamp,
          entry.ttl,
          entry.accessCount,
          entry.lastAccessed,
          entry.size,
          compressed,
          encrypted,
          tags,
          metadata
        ]
      );
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_SET_ERROR', error);
    }
  }

  private async deleteFromDatabase(key: string): Promise<void> {
    try {
      await this.executeSqlAsync('DELETE FROM cache_entries WHERE key = ?', [key]);
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_DELETE_ERROR', error);
    }
  }

  private async clearDatabase(): Promise<void> {
    try {
      await this.executeSqlAsync('DELETE FROM cache_entries');
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_CLEAR_ERROR', error);
    }
  }

  /**
   * Background Tasks
   */

  private async performBackgroundCleanup(): Promise<void> {
    try {
      // Clean expired entries
      await this.cleanupExpiredEntries();
      
      // Check memory pressure
      await this.handleMemoryPressure();
      
      // Optimize database
      await this.optimizeDatabase();
      
    } catch (error) {
      this.errorHandler.logError('BACKGROUND_CLEANUP_ERROR', error);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    
    // Clean memory cache (LRU handles this automatically)
    
    // Clean database cache
    await this.executeSqlAsync(
      'DELETE FROM cache_entries WHERE (timestamp + ttl) < ?',
      [now]
    );
  }

  private async handleMemoryPressure(): Promise<void> {
    const now = Date.now();
    
    // Check memory usage only every 30 seconds
    if (now - this.lastMemoryCheck < 30000) return;
    this.lastMemoryCheck = now;

    const currentSize = this.memoryCache.calculatedSize || 0;
    const maxSize = this.config.memoryMaxSize;
    const usage = currentSize / maxSize;

    if (usage > this.memoryPressureThreshold) {
      // Remove least recently used entries
      const targetSize = maxSize * 0.7; // Target 70% usage
      
      while (this.memoryCache.calculatedSize! > targetSize && this.memoryCache.size > 0) {
        const oldestKey = this.memoryCache.keys().next().value;
        if (oldestKey) {
          this.memoryCache.delete(oldestKey);
        } else {
          break;
        }
      }
    }
  }

  private async performCacheWarmup(): Promise<void> {
    try {
      // Preload critical educational data based on user context
      const criticalStrategies = EDUCATIONAL_CACHE_STRATEGIES.filter(
        s => s.preloadStrategy === 'eager' && s.priority === 'critical'
      );

      for (const strategy of criticalStrategies) {
        // This would be implemented based on specific app requirements
        // For now, we just log the intent
        this.errorHandler.logError('CACHE_WARMUP', { 
          strategy: strategy.entity,
          description: 'Would preload critical data'
        });
      }
    } catch (error) {
      this.errorHandler.logError('CACHE_WARMUP_ERROR', error);
    }
  }

  private async optimizeDatabase(): Promise<void> {
    try {
      // Vacuum database periodically
      await this.executeSqlAsync('VACUUM');
      
      // Update statistics
      await this.updateCacheStatistics();
      
    } catch (error) {
      this.errorHandler.logError('CACHE_DB_OPTIMIZE_ERROR', error);
    }
  }

  /**
   * Utility Methods
   */

  private getEducationalStrategy(key: string): EducationalSyncContext | undefined {
    return EDUCATIONAL_CACHE_STRATEGIES.find(strategy => 
      key.includes(strategy.entity) || key.startsWith(strategy.entity)
    );
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (entry.timestamp + entry.ttl) > now;
  }

  private shouldCompress(entry: CacheEntry, options?: CacheOptions): boolean {
    if (options?.compress === false) return false;
    
    const strategy = this.getEducationalStrategy(entry.key);
    if (strategy && !strategy.compressionEnabled) return false;
    
    return entry.size > this.config.compressionThreshold;
  }

  private shouldEncrypt(entry: CacheEntry, options?: CacheOptions): boolean {
    if (!this.config.encryptSensitiveData) return false;
    if (options?.encrypt === false) return false;
    
    const strategy = this.getEducationalStrategy(entry.key);
    return strategy ? strategy.encryptionRequired : false;
  }

  private compressData(data: any): any {
    // Simple compression using JSON stringification
    // In a real implementation, you might use a proper compression library
    const jsonString = JSON.stringify(data);
    return {
      __compressed: true,
      data: jsonString
    };
  }

  private decompressData(data: any): any {
    if (data.__compressed) {
      return JSON.parse(data.data);
    }
    return data;
  }

  private encryptData(data: any): any {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    return {
      __encrypted: true,
      data: encrypted
    };
  }

  private decryptData(data: any): any {
    if (data.__encrypted) {
      const decrypted = CryptoJS.AES.decrypt(data.data, this.encryptionKey);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    }
    return data;
  }

  private calculateSize(data: any): number {
    // Rough calculation of data size
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  private generateEncryptionKey(): string {
    // Generate a consistent key based on device info
    // In production, this should be more secure
    return `harry_school_${Platform.OS}_${Platform.Version}`;
  }

  private getStorageKey(key: string): string {
    return `@harry_cache:${key}`;
  }

  private hasMatchingTag(entryTags: string[], searchTags: string[]): boolean {
    return searchTags.some(tag => entryTags.includes(tag));
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private updatePerformanceStats(accessTime: number): void {
    this.stats.averageAccessTime = 
      (this.stats.averageAccessTime + accessTime) / 2;
  }

  private updateCacheStats(entry: CacheEntry, operation: 'set' | 'get'): void {
    if (operation === 'set') {
      this.stats.entryCount++;
      this.stats.totalSize += entry.size;
    }
    
    const totalRequests = 
      this.stats.memoryHits + this.stats.memoryMisses +
      this.stats.storageHits + this.stats.storageMisses +
      this.stats.databaseHits + this.stats.databaseMisses;
      
    const totalHits = 
      this.stats.memoryHits + this.stats.storageHits + this.stats.databaseHits;
      
    this.stats.hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  private async updateCacheStatistics(): Promise<void> {
    try {
      const result = await this.querySqlAsync(
        'SELECT COUNT(*) as count, SUM(size) as total_size FROM cache_entries'
      );
      
      if (result.rows.length > 0) {
        const row = result.rows.item(0);
        this.stats.entryCount = row.count;
        this.stats.totalSize = row.total_size || 0;
      }
    } catch (error) {
      this.errorHandler.logError('CACHE_STATS_UPDATE_ERROR', error);
    }
  }

  private async invalidateStorageByTags(tags: string[]): Promise<void> {
    // This is expensive, so we do it in background
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@harry_cache:'));
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const entry = JSON.parse(data) as CacheEntry;
          if (entry.metadata?.tags && this.hasMatchingTag(entry.metadata.tags, tags)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      this.errorHandler.logError('STORAGE_TAG_INVALIDATION_ERROR', error);
    }
  }

  private async invalidateStorageByPattern(regex: RegExp): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@harry_cache:'));
      const matchingKeys = cacheKeys.filter(key => {
        const cacheKey = key.replace('@harry_cache:', '');
        return regex.test(cacheKey);
      });
      
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      this.errorHandler.logError('STORAGE_PATTERN_INVALIDATION_ERROR', error);
    }
  }

  /**
   * SQLite Helper Methods
   */

  private executeSqlAsync(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.transaction((tx) => {
        tx.executeSql(sql, params, (_, result) => resolve(result), (_, error) => reject(error));
      });
    });
  }

  private querySqlAsync(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.readTransaction((tx) => {
        tx.executeSql(sql, params, (_, result) => resolve(result), (_, error) => reject(error));
      });
    });
  }

  /**
   * Public API Methods
   */

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async warmupCache(keys: string[]): Promise<void> {
    // Pre-warm specific cache keys
    for (const key of keys) {
      await this.get(key, { useCache: true });
    }
  }

  async getCacheSize(): Promise<{ memory: number; storage: number; database: number }> {
    const memorySize = this.memoryCache.calculatedSize || 0;
    
    // Get storage size
    let storageSize = 0;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@harry_cache:'));
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          storageSize += new Blob([data]).size;
        }
      }
    } catch (error) {
      this.errorHandler.logError('STORAGE_SIZE_CALC_ERROR', error);
    }

    // Get database size
    let databaseSize = 0;
    try {
      const result = await this.querySqlAsync('SELECT SUM(size) as total FROM cache_entries');
      if (result.rows.length > 0) {
        databaseSize = result.rows.item(0).total || 0;
      }
    } catch (error) {
      this.errorHandler.logError('DB_SIZE_CALC_ERROR', error);
    }

    return { memory: memorySize, storage: storageSize, database: databaseSize };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    if (this.warmupTimer) {
      clearInterval(this.warmupTimer);
      this.warmupTimer = undefined;
    }

    this.memoryCache.clear();
  }
}

export default CacheManager;