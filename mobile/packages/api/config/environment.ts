import { Platform } from 'react-native';
import type { SupabaseConfig } from '../types/supabase';

/**
 * Environment configuration loader for Harry School mobile apps
 * Handles environment variables and provides typed configuration
 */

export interface AppEnvironmentConfig extends SupabaseConfig {
  // App Info
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  
  // Feature Flags
  enableOfflineQueue: boolean;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enableDebugMode: boolean;
  
  // Network Configuration
  requestTimeout: number;
  apiRateLimit: {
    requests: number;
    windowMs: number;
  };
  
  // File Upload
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Offline Configuration
  offlineQueueMaxSize: number;
  offlineSyncInterval: number;
  
  // App-specific intervals
  rankingRefreshInterval: number;
  groupRefreshInterval: number;
  taskCacheTTL: number;
  attendanceCacheTTL: number;
  
  // Realtime Configuration
  realtimeHeartbeatInterval: number;
  realtimeReconnectDelay: number;
  
  // Performance Monitoring
  performanceSampleRate: number;
  slowQueryThreshold: number;
  
  // Backup and Sync
  autoBackupInterval: number;
  syncConflictResolution: 'client' | 'server' | 'merge' | 'manual';
  
  // Accessibility
  accessibilityFontScaleMax: number;
  accessibilityContrastMode: boolean;
  
  // Development Settings
  devSettings: {
    enableConsoleLogs: boolean;
    mockData: boolean;
  };
}

/**
 * Parse environment variable as boolean
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse environment variable as number
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse environment variable as array
 */
const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * Get environment-specific defaults
 */
const getEnvironmentDefaults = (env: string) => {
  const isDev = env === 'development';
  const isProd = env === 'production';
  
  return {
    // Cache settings
    cacheDefaultTTL: isDev ? 60000 : 300000, // 1 min dev, 5 min prod
    cacheMaxSize: isDev ? 5242880 : 10485760, // 5MB dev, 10MB prod
    cacheMaxEntries: isDev ? 500 : 1000,
    
    // Security settings
    sessionTimeout: isDev ? 7200000 : 14400000, // 2 hours dev, 4 hours prod
    maxInactiveTime: isDev ? 3600000 : 1800000, // 1 hour dev, 30 min prod
    maxLoginAttempts: isDev ? 10 : 5,
    
    // Performance settings
    enablePerformanceMonitoring: isDev,
    performanceSampleRate: isDev ? 1.0 : 0.1,
    slowQueryThreshold: isDev ? 1000 : 2000,
    
    // Development features
    enableDebugMode: isDev,
    enableConsoleLogs: isDev,
    mockData: false,
  };
};

/**
 * Load and validate environment configuration
 */
export const loadEnvironmentConfig = (): AppEnvironmentConfig => {
  // Get environment type
  const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production';
  const envDefaults = getEnvironmentDefaults(environment);
  
  // Validate required environment variables
  const requiredVars = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
  
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  const config: AppEnvironmentConfig = {
    // Supabase Configuration
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    
    // App Info
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'Harry School',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    environment,
    
    // Feature Flags
    enableOfflineQueue: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_OFFLINE_QUEUE, true),
    enablePerformanceMonitoring: parseBoolean(
      process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING, 
      envDefaults.enablePerformanceMonitoring
    ),
    enableAnalytics: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_ANALYTICS, false),
    enableCrashReporting: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING, false),
    enableDebugMode: parseBoolean(process.env.EXPO_PUBLIC_DEV_ENABLE_DEBUG_MODE, envDefaults.enableDebugMode),
    
    // Cache Configuration
    cacheConfig: {
      defaultTTL: parseNumber(process.env.EXPO_PUBLIC_CACHE_DEFAULT_TTL, envDefaults.cacheDefaultTTL),
      maxSize: parseNumber(process.env.EXPO_PUBLIC_CACHE_MAX_SIZE, envDefaults.cacheMaxSize),
      maxEntries: parseNumber(process.env.EXPO_PUBLIC_CACHE_MAX_ENTRIES, envDefaults.cacheMaxEntries),
    },
    
    // Retry Configuration
    retryConfig: {
      maxRetries: parseNumber(process.env.EXPO_PUBLIC_MAX_RETRIES, 3),
      baseDelay: parseNumber(process.env.EXPO_PUBLIC_RETRY_BASE_DELAY, 1000),
      maxDelay: parseNumber(process.env.EXPO_PUBLIC_RETRY_MAX_DELAY, 5000),
    },
    
    // Security Configuration
    securityConfig: {
      sessionTimeout: parseNumber(process.env.EXPO_PUBLIC_SESSION_TIMEOUT, envDefaults.sessionTimeout),
      maxInactiveTime: parseNumber(process.env.EXPO_PUBLIC_MAX_INACTIVE_TIME, envDefaults.maxInactiveTime),
      maxLoginAttempts: parseNumber(process.env.EXPO_PUBLIC_MAX_LOGIN_ATTEMPTS, envDefaults.maxLoginAttempts),
    },
    
    // Network Configuration
    requestTimeout: parseNumber(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT, 10000),
    apiRateLimit: {
      requests: parseNumber(process.env.EXPO_PUBLIC_API_RATE_LIMIT_REQUESTS, 100),
      windowMs: parseNumber(process.env.EXPO_PUBLIC_API_RATE_LIMIT_WINDOW, 60000),
    },
    
    // File Upload Configuration
    maxFileSize: parseNumber(process.env.EXPO_PUBLIC_MAX_FILE_SIZE, 5242880), // 5MB
    allowedFileTypes: parseArray(
      process.env.EXPO_PUBLIC_ALLOWED_FILE_TYPES, 
      ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav']
    ),
    
    // Offline Configuration
    offlineQueueMaxSize: parseNumber(process.env.EXPO_PUBLIC_OFFLINE_QUEUE_MAX_SIZE, 1000),
    offlineSyncInterval: parseNumber(process.env.EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL, 30000),
    
    // App-specific intervals
    rankingRefreshInterval: parseNumber(process.env.EXPO_PUBLIC_STUDENT_RANKING_REFRESH_INTERVAL, 300000),
    groupRefreshInterval: parseNumber(process.env.EXPO_PUBLIC_TEACHER_GROUP_REFRESH_INTERVAL, 600000),
    taskCacheTTL: parseNumber(process.env.EXPO_PUBLIC_STUDENT_TASK_CACHE_TTL, 600000),
    attendanceCacheTTL: parseNumber(process.env.EXPO_PUBLIC_TEACHER_ATTENDANCE_CACHE_TTL, 1800000),
    
    // Realtime Configuration
    realtimeHeartbeatInterval: parseNumber(process.env.EXPO_PUBLIC_REALTIME_HEARTBEAT_INTERVAL, 30000),
    realtimeReconnectDelay: parseNumber(process.env.EXPO_PUBLIC_REALTIME_RECONNECT_DELAY, 5000),
    
    // Performance Monitoring
    performanceSampleRate: parseNumber(process.env.EXPO_PUBLIC_PERFORMANCE_SAMPLE_RATE, envDefaults.performanceSampleRate),
    slowQueryThreshold: parseNumber(process.env.EXPO_PUBLIC_SLOW_QUERY_THRESHOLD, envDefaults.slowQueryThreshold),
    
    // Backup and Sync
    autoBackupInterval: parseNumber(process.env.EXPO_PUBLIC_AUTO_BACKUP_INTERVAL, 86400000), // 24 hours
    syncConflictResolution: (process.env.EXPO_PUBLIC_SYNC_CONFLICT_RESOLUTION as any) || 'server',
    
    // Accessibility
    accessibilityFontScaleMax: parseNumber(process.env.EXPO_PUBLIC_ACCESSIBILITY_FONT_SCALE_MAX, 2.0),
    accessibilityContrastMode: parseBoolean(process.env.EXPO_PUBLIC_ACCESSIBILITY_CONTRAST_MODE, false),
    
    // Development Settings
    devSettings: {
      enableConsoleLogs: parseBoolean(process.env.EXPO_PUBLIC_DEV_ENABLE_CONSOLE_LOGS, envDefaults.enableConsoleLogs),
      mockData: parseBoolean(process.env.EXPO_PUBLIC_DEV_MOCK_DATA, envDefaults.mockData),
    },
  };
  
  // Validate configuration
  validateConfiguration(config);
  
  return config;
};

/**
 * Validate configuration values
 */
const validateConfiguration = (config: AppEnvironmentConfig): void => {
  const errors: string[] = [];
  
  // Validate URLs
  try {
    new URL(config.supabaseUrl);
  } catch {
    errors.push('Invalid Supabase URL');
  }
  
  // Validate numbers
  if (config.cacheConfig.maxSize <= 0) {
    errors.push('Cache max size must be positive');
  }
  
  if (config.cacheConfig.maxEntries <= 0) {
    errors.push('Cache max entries must be positive');
  }
  
  if (config.retryConfig.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }
  
  if (config.requestTimeout <= 0) {
    errors.push('Request timeout must be positive');
  }
  
  // Validate performance sample rate
  if (config.performanceSampleRate < 0 || config.performanceSampleRate > 1) {
    errors.push('Performance sample rate must be between 0 and 1');
  }
  
  // Validate file size
  if (config.maxFileSize <= 0) {
    errors.push('Max file size must be positive');
  }
  
  // Validate sync conflict resolution
  const validResolutions = ['client', 'server', 'merge', 'manual'];
  if (!validResolutions.includes(config.syncConflictResolution)) {
    errors.push(`Invalid sync conflict resolution. Must be one of: ${validResolutions.join(', ')}`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

/**
 * Get platform-specific configuration adjustments
 */
export const getPlatformConfig = (config: AppEnvironmentConfig): Partial<AppEnvironmentConfig> => {
  const platformAdjustments: Partial<AppEnvironmentConfig> = {};
  
  if (Platform.OS === 'ios') {
    // iOS-specific adjustments
    platformAdjustments.cacheConfig = {
      ...config.cacheConfig,
      maxSize: config.cacheConfig.maxSize * 0.8, // Be more conservative on iOS
    };
  } else if (Platform.OS === 'android') {
    // Android-specific adjustments
    platformAdjustments.realtimeHeartbeatInterval = config.realtimeHeartbeatInterval * 1.2; // Slightly longer on Android
  }
  
  return platformAdjustments;
};

/**
 * Create a development configuration with sensible defaults
 */
export const createDevelopmentConfig = (overrides?: Partial<AppEnvironmentConfig>): AppEnvironmentConfig => {
  const baseConfig = loadEnvironmentConfig();
  
  const devConfig: Partial<AppEnvironmentConfig> = {
    environment: 'development',
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    cacheConfig: {
      defaultTTL: 60000, // 1 minute
      maxSize: 5242880, // 5MB
      maxEntries: 500,
    },
    securityConfig: {
      sessionTimeout: 7200000, // 2 hours
      maxInactiveTime: 3600000, // 1 hour
      maxLoginAttempts: 10,
    },
    devSettings: {
      enableConsoleLogs: true,
      mockData: false,
    },
    ...overrides,
  };
  
  return { ...baseConfig, ...devConfig };
};

/**
 * Create a production configuration with security-focused defaults
 */
export const createProductionConfig = (overrides?: Partial<AppEnvironmentConfig>): AppEnvironmentConfig => {
  const baseConfig = loadEnvironmentConfig();
  
  const prodConfig: Partial<AppEnvironmentConfig> = {
    environment: 'production',
    enableDebugMode: false,
    enablePerformanceMonitoring: false,
    performanceSampleRate: 0.01, // 1% sampling in production
    devSettings: {
      enableConsoleLogs: false,
      mockData: false,
    },
    ...overrides,
  };
  
  return { ...baseConfig, ...prodConfig };
};

// Singleton instance
let configInstance: AppEnvironmentConfig | null = null;

/**
 * Get the current configuration instance
 */
export const getConfig = (): AppEnvironmentConfig => {
  if (!configInstance) {
    configInstance = loadEnvironmentConfig();
  }
  return configInstance;
};

/**
 * Reset the configuration instance (useful for testing)
 */
export const resetConfig = (): void => {
  configInstance = null;
};

export type { AppEnvironmentConfig };