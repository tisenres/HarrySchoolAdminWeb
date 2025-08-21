/**
 * Supabase Client Configuration Utilities
 * 
 * Provides utility functions for creating and validating Supabase client configurations
 * with mobile-specific optimizations and educational context awareness.
 */

import { Platform } from 'react-native';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import type { AppEnvironmentConfig } from '../config/environment';
import type { SupabaseConfig } from '../types/supabase';

/**
 * Create optimized Supabase client configuration for mobile
 */
export function createSupabaseClientConfig(config: AppEnvironmentConfig): SupabaseClientOptions<'public'> {
  return {
    auth: {
      // Mobile-optimized authentication settings
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not applicable for mobile
      storageKey: '@harry-school:auth-token',
      flowType: 'pkce', // Use PKCE flow for better security
    },
    
    realtime: {
      // Mobile-optimized realtime settings
      params: {
        eventsPerSecond: config.enablePerformanceMonitoring ? 10 : 5,
      },
      heartbeatIntervalMs: 30000, // 30 seconds for mobile
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff with jitter for mobile networks
        const baseDelay = 1000;
        const maxDelay = 30000;
        const jitter = Math.random() * 1000;
        return Math.min(baseDelay * Math.pow(2, tries) + jitter, maxDelay);
      },
      timeout: config.requestTimeout || 10000,
    },
    
    global: {
      headers: {
        'X-Client-Info': `harry-school-mobile/${Platform.OS}/${Platform.Version}`,
        'X-App-Version': config.appVersion || '1.0.0',
        'X-Organization-Context': 'educational',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache', // Disable HTTP caching in favor of our custom cache
      },
      // Mobile network optimization
      fetch: createOptimizedFetch(config),
    },
    
    db: {
      schema: 'public',
    },
  };
}

/**
 * Create optimized fetch function for mobile networks
 */
function createOptimizedFetch(config: AppEnvironmentConfig) {
  return (url: RequestInfo | URL, options?: RequestInit) => {
    const optimizedOptions: RequestInit = {
      ...options,
      // Set timeout based on configuration
      signal: options?.signal || AbortSignal.timeout(config.requestTimeout || 10000),
      
      // Optimize headers
      headers: {
        ...options?.headers,
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    };

    // Add retry logic for mobile networks
    return fetchWithRetry(url, optimizedOptions, config.retryConfig);
  };
}

/**
 * Fetch with built-in retry logic for unreliable mobile networks
 */
async function fetchWithRetry(
  url: RequestInfo | URL, 
  options: RequestInit, 
  retryConfig: AppEnvironmentConfig['retryConfig']
): Promise<Response> {
  const maxRetries = retryConfig.maxRetries || 3;
  const baseDelay = retryConfig.baseDelay || 1000;
  const maxDelay = retryConfig.maxDelay || 5000;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Check if the response indicates a retryable error
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry client errors (4xx except 429)
      if (error instanceof Error && error.message.includes('4')) {
        const status = parseInt(error.message.match(/\d+/)?.[0] || '0');
        if (status >= 400 && status < 500 && status !== 429) {
          break;
        }
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(config: Partial<SupabaseConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!config.supabaseUrl) {
    errors.push('supabaseUrl is required');
  } else {
    try {
      new URL(config.supabaseUrl);
    } catch {
      errors.push('supabaseUrl must be a valid URL');
    }
  }
  
  if (!config.supabaseAnonKey) {
    errors.push('supabaseAnonKey is required');
  } else if (config.supabaseAnonKey.length < 100) {
    warnings.push('supabaseAnonKey appears to be too short');
  }
  
  // Cache configuration validation
  if (config.cacheConfig) {
    if (config.cacheConfig.maxSize && config.cacheConfig.maxSize < 1024) {
      warnings.push('Cache maxSize is very small, performance may be impacted');
    }
    
    if (config.cacheConfig.defaultTTL && config.cacheConfig.defaultTTL < 1000) {
      warnings.push('Cache defaultTTL is very short, may cause excessive requests');
    }
    
    if (config.cacheConfig.maxEntries && config.cacheConfig.maxEntries < 10) {
      warnings.push('Cache maxEntries is very low, cache effectiveness may be limited');
    }
  }
  
  // Retry configuration validation
  if (config.retryConfig) {
    if (config.retryConfig.maxRetries && config.retryConfig.maxRetries > 10) {
      warnings.push('High maxRetries value may cause delays in error scenarios');
    }
    
    if (config.retryConfig.baseDelay && config.retryConfig.baseDelay > 5000) {
      warnings.push('High baseDelay may impact user experience');
    }
  }
  
  // Security configuration validation
  if (config.securityConfig) {
    if (config.securityConfig.sessionTimeout) {
      const hourInMs = 60 * 60 * 1000;
      if (config.securityConfig.sessionTimeout > 24 * hourInMs) {
        warnings.push('Session timeout is very long, consider security implications');
      }
      if (config.securityConfig.sessionTimeout < hourInMs) {
        warnings.push('Session timeout is very short, may impact user experience');
      }
    }
    
    if (config.securityConfig.maxLoginAttempts && config.securityConfig.maxLoginAttempts < 3) {
      warnings.push('Very low maxLoginAttempts may lock out users easily');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create development-optimized configuration
 */
export function createDevelopmentSupabaseConfig(
  baseConfig: Partial<SupabaseConfig>
): SupabaseConfig {
  return {
    // Base configuration
    ...baseConfig,
    
    // Development-specific overrides
    enablePerformanceMonitoring: true,
    enableOfflineQueue: true,
    
    cacheConfig: {
      defaultTTL: 60 * 1000, // 1 minute for development
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 500,
      ...baseConfig.cacheConfig
    },
    
    retryConfig: {
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 3000,
      ...baseConfig.retryConfig
    },
    
    securityConfig: {
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours for development
      maxInactiveTime: 60 * 60 * 1000, // 1 hour
      maxLoginAttempts: 10,
      ...baseConfig.securityConfig
    }
  } as SupabaseConfig;
}

/**
 * Create production-optimized configuration
 */
export function createProductionSupabaseConfig(
  baseConfig: Partial<SupabaseConfig>
): SupabaseConfig {
  return {
    // Base configuration
    ...baseConfig,
    
    // Production-specific overrides
    enablePerformanceMonitoring: false, // Disabled by default in production
    enableOfflineQueue: true,
    
    cacheConfig: {
      defaultTTL: 15 * 60 * 1000, // 15 minutes for production
      maxSize: 20 * 1024 * 1024, // 20MB
      maxEntries: 2000,
      ...baseConfig.cacheConfig
    },
    
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      ...baseConfig.retryConfig
    },
    
    securityConfig: {
      sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours for production
      maxInactiveTime: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      ...baseConfig.securityConfig
    }
  } as SupabaseConfig;
}

/**
 * Get platform-specific configuration adjustments
 */
export function getPlatformSpecificConfig(): Partial<SupabaseClientOptions> {
  const platformConfig: Partial<SupabaseClientOptions> = {};
  
  if (Platform.OS === 'ios') {
    // iOS-specific optimizations
    platformConfig.global = {
      headers: {
        'User-Agent': `HarrySchool-iOS/${Platform.Version}`,
        // iOS handles gzip automatically
      }
    };
    
    platformConfig.realtime = {
      params: {
        // iOS handles WebSocket connections well
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 25000, // Slightly faster on iOS
    };
  } else if (Platform.OS === 'android') {
    // Android-specific optimizations
    platformConfig.global = {
      headers: {
        'User-Agent': `HarrySchool-Android/${Platform.Version}`,
      }
    };
    
    platformConfig.realtime = {
      params: {
        // Android may need more conservative settings
        eventsPerSecond: 5,
      },
      heartbeatIntervalMs: 35000, // Longer interval on Android
    };
  }
  
  return platformConfig;
}

/**
 * Create configuration for testing environments
 */
export function createTestingSupabaseConfig(
  baseConfig: Partial<SupabaseConfig>
): SupabaseConfig {
  return {
    // Base configuration
    ...baseConfig,
    
    // Testing-specific overrides
    enablePerformanceMonitoring: false,
    enableOfflineQueue: false, // Simplified for testing
    
    cacheConfig: {
      defaultTTL: 1000, // Very short for testing
      maxSize: 1024 * 1024, // 1MB
      maxEntries: 100,
      ...baseConfig.cacheConfig
    },
    
    retryConfig: {
      maxRetries: 1, // Minimal retries for faster tests
      baseDelay: 100,
      maxDelay: 500,
      ...baseConfig.retryConfig
    },
    
    securityConfig: {
      sessionTimeout: 60 * 1000, // 1 minute for testing
      maxInactiveTime: 30 * 1000, // 30 seconds
      maxLoginAttempts: 3,
      ...baseConfig.securityConfig
    }
  } as SupabaseConfig;
}

/**
 * Educational context-specific configuration helpers
 */
export const EDUCATIONAL_CONFIG_PRESETS = {
  /**
   * Configuration optimized for student mobile apps
   */
  STUDENT_APP: {
    cacheConfig: {
      defaultTTL: 10 * 60 * 1000, // 10 minutes - students access data frequently
      maxSize: 15 * 1024 * 1024, // 15MB - cache vocabulary, tasks, etc.
      maxEntries: 1500
    },
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    },
    enableOfflineQueue: true, // Critical for student progress tracking
    enablePerformanceMonitoring: false
  } as Partial<SupabaseConfig>,
  
  /**
   * Configuration optimized for teacher mobile apps
   */
  TEACHER_APP: {
    cacheConfig: {
      defaultTTL: 5 * 60 * 1000, // 5 minutes - teachers need fresher data
      maxSize: 25 * 1024 * 1024, // 25MB - cache student lists, attendance, etc.
      maxEntries: 2000
    },
    retryConfig: {
      maxRetries: 5, // Teachers have less tolerance for failures
      baseDelay: 500,
      maxDelay: 3000
    },
    enableOfflineQueue: true, // Critical for attendance marking
    enablePerformanceMonitoring: true // Helpful for teacher workflow optimization
  } as Partial<SupabaseConfig>,
  
  /**
   * Configuration optimized for admin apps
   */
  ADMIN_APP: {
    cacheConfig: {
      defaultTTL: 2 * 60 * 1000, // 2 minutes - admins need real-time data
      maxSize: 50 * 1024 * 1024, // 50MB - comprehensive data caching
      maxEntries: 5000
    },
    retryConfig: {
      maxRetries: 5,
      baseDelay: 200,
      maxDelay: 2000
    },
    enableOfflineQueue: false, // Admins typically work with live data
    enablePerformanceMonitoring: true
  } as Partial<SupabaseConfig>
} as const;

/**
 * Apply educational preset to configuration
 */
export function applyEducationalPreset(
  config: Partial<SupabaseConfig>,
  preset: keyof typeof EDUCATIONAL_CONFIG_PRESETS
): SupabaseConfig {
  const presetConfig = EDUCATIONAL_CONFIG_PRESETS[preset];
  
  return {
    // Start with preset
    ...presetConfig,
    // Apply user config on top
    ...config,
    // Merge nested objects properly
    cacheConfig: {
      ...presetConfig.cacheConfig,
      ...config.cacheConfig
    },
    retryConfig: {
      ...presetConfig.retryConfig,
      ...config.retryConfig
    },
    securityConfig: {
      ...presetConfig.securityConfig,
      ...config.securityConfig
    }
  } as SupabaseConfig;
}