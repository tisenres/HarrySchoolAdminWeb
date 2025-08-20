import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ErrorLog {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  context?: any;
  userAgent: string;
  platform: string;
  retryCount?: number;
  resolved?: boolean;
}

interface UserFriendlyError {
  title: string;
  message: string;
  action?: {
    label: string;
    type: 'retry' | 'refresh' | 'contact' | 'settings';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Comprehensive error handling system for mobile Supabase operations
 * Provides user-friendly error messages, logging, and recovery strategies
 */
export class ErrorHandler {
  private static readonly ERROR_LOG_KEY = '@harry-school:error-logs';
  private static readonly MAX_LOG_ENTRIES = 100;
  private static readonly ERROR_PATTERNS = {
    // Network errors
    NETWORK_ERROR: /network|connection|timeout|fetch/i,
    OFFLINE_ERROR: /offline|no internet|network request failed/i,
    
    // Authentication errors  
    AUTH_ERROR: /auth|unauthorized|forbidden|token|session/i,
    EXPIRED_TOKEN: /expired|invalid.*token|jwt/i,
    
    // Database errors
    RLS_ERROR: /row.*level.*security|rls|policy/i,
    CONSTRAINT_ERROR: /constraint|duplicate|foreign.*key|unique/i,
    PERMISSION_ERROR: /permission|access.*denied|insufficient.*privileges/i,
    
    // Rate limiting
    RATE_LIMIT: /rate.*limit|too.*many.*requests|429/i,
    
    // Server errors
    SERVER_ERROR: /internal.*server|500|502|503|504/i,
    MAINTENANCE: /maintenance|temporarily.*unavailable/i,
  };

  constructor() {
    this.cleanupOldLogs();
  }

  /**
   * Log an error with context and generate user-friendly message
   */
  async logError(type: string, error: any, context?: any): Promise<string> {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      message: this.extractErrorMessage(error),
      stack: error?.stack,
      context,
      userAgent: await this.getUserAgent(),
      platform: Platform.OS,
      retryCount: 0,
      resolved: false,
    };

    await this.storeErrorLog(errorLog);
    
    // Send to analytics/crash reporting if available
    this.reportToAnalytics(errorLog);
    
    return errorLog.id;
  }

  /**
   * Get user-friendly error message and suggested action
   */
  getUserFriendlyError(error: any): UserFriendlyError {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = error?.code || error?.status;
    
    // Check for specific error patterns
    if (this.matchesPattern(errorMessage, 'NETWORK_ERROR')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: { label: 'Retry', type: 'retry' },
        severity: 'medium',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'OFFLINE_ERROR')) {
      return {
        title: 'No Internet Connection',
        message: 'You appear to be offline. Your changes will be saved and synced when you reconnect.',
        severity: 'low',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'AUTH_ERROR') || errorCode === 401) {
      return {
        title: 'Authentication Required',
        message: 'Please sign in again to continue.',
        action: { label: 'Sign In', type: 'refresh' },
        severity: 'high',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'EXPIRED_TOKEN')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.',
        action: { label: 'Sign In', type: 'refresh' },
        severity: 'high',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'RLS_ERROR') || errorCode === 403) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        severity: 'medium',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'CONSTRAINT_ERROR')) {
      return {
        title: 'Data Conflict',
        message: 'This information conflicts with existing data. Please check your input.',
        severity: 'medium',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'RATE_LIMIT') || errorCode === 429) {
      return {
        title: 'Too Many Attempts',
        message: 'Please wait a moment before trying again.',
        action: { label: 'Retry Later', type: 'retry' },
        severity: 'low',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'SERVER_ERROR') || (errorCode >= 500 && errorCode < 600)) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again in a few minutes.',
        action: { label: 'Retry', type: 'retry' },
        severity: 'high',
      };
    }
    
    if (this.matchesPattern(errorMessage, 'MAINTENANCE')) {
      return {
        title: 'Maintenance Mode',
        message: 'The app is temporarily unavailable for maintenance. Please try again later.',
        severity: 'medium',
      };
    }
    
    // Generic error for unknown issues
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. If this continues, please contact support.',
      action: { label: 'Contact Support', type: 'contact' },
      severity: 'medium',
    };
  }

  /**
   * Get a simplified error message for API responses
   */
  getErrorMessage(error: any): string {
    const friendlyError = this.getUserFriendlyError(error);
    return friendlyError.message;
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: any): boolean {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = error?.code || error?.status;
    
    // Network issues are generally retryable
    if (this.matchesPattern(errorMessage, 'NETWORK_ERROR')) return true;
    if (this.matchesPattern(errorMessage, 'OFFLINE_ERROR')) return false; // Handle via offline queue
    
    // Server errors are retryable
    if (errorCode >= 500 && errorCode < 600) return true;
    if (this.matchesPattern(errorMessage, 'SERVER_ERROR')) return true;
    
    // Rate limiting is retryable with backoff
    if (errorCode === 429 || this.matchesPattern(errorMessage, 'RATE_LIMIT')) return true;
    
    // Auth errors generally require user intervention
    if (errorCode === 401 || this.matchesPattern(errorMessage, 'AUTH_ERROR')) return false;
    if (this.matchesPattern(errorMessage, 'EXPIRED_TOKEN')) return false;
    
    // Permission errors are not retryable
    if (errorCode === 403 || this.matchesPattern(errorMessage, 'RLS_ERROR')) return false;
    
    // Data constraint errors are not retryable without changes
    if (this.matchesPattern(errorMessage, 'CONSTRAINT_ERROR')) return false;
    
    // Default to not retryable for unknown errors
    return false;
  }

  /**
   * Get error logs for debugging or user feedback
   */
  async getErrorLogs(limit: number = 50): Promise<ErrorLog[]> {
    try {
      const stored = await AsyncStorage.getItem(ErrorHandler.ERROR_LOG_KEY);
      const logs: ErrorLog[] = stored ? JSON.parse(stored) : [];
      return logs.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  /**
   * Clear error logs (for privacy or storage management)
   */
  async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ErrorHandler.ERROR_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  /**
   * Mark an error as resolved (useful for tracking)
   */
  async markErrorResolved(errorId: string): Promise<void> {
    try {
      const logs = await this.getErrorLogs(ErrorHandler.MAX_LOG_ENTRIES);
      const updatedLogs = logs.map(log => 
        log.id === errorId ? { ...log, resolved: true } : log
      );
      await AsyncStorage.setItem(ErrorHandler.ERROR_LOG_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to mark error as resolved:', error);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStatistics(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: number; // Last 24 hours
    resolvedErrors: number;
  }> {
    const logs = await this.getErrorLogs(ErrorHandler.MAX_LOG_ENTRIES);
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const stats = {
      totalErrors: logs.length,
      errorsByType: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      recentErrors: 0,
      resolvedErrors: 0,
    };
    
    logs.forEach(log => {
      // Count by type
      stats.errorsByType[log.type] = (stats.errorsByType[log.type] || 0) + 1;
      
      // Count by severity
      const friendlyError = this.getUserFriendlyError({ message: log.message });
      stats.errorsBySeverity[friendlyError.severity] = 
        (stats.errorsBySeverity[friendlyError.severity] || 0) + 1;
      
      // Count recent errors
      if (log.timestamp > twentyFourHoursAgo) {
        stats.recentErrors++;
      }
      
      // Count resolved errors
      if (log.resolved) {
        stats.resolvedErrors++;
      }
    });
    
    return stats;
  }

  // Private helper methods

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (error?.details) return error.details;
    if (error?.hint) return error.hint;
    return 'Unknown error occurred';
  }

  private matchesPattern(message: string, patternKey: keyof typeof ErrorHandler.ERROR_PATTERNS): boolean {
    const pattern = ErrorHandler.ERROR_PATTERNS[patternKey];
    return pattern.test(message);
  }

  private async storeErrorLog(errorLog: ErrorLog): Promise<void> {
    try {
      const existing = await this.getErrorLogs(ErrorHandler.MAX_LOG_ENTRIES - 1);
      const updated = [...existing, errorLog];
      await AsyncStorage.setItem(ErrorHandler.ERROR_LOG_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  private async getUserAgent(): Promise<string> {
    // Get app version and device info
    const platform = Platform.OS;
    const version = Platform.Version;
    return `HarrySchool-Mobile/${platform}/${version}`;
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const logs = await this.getErrorLogs(ErrorHandler.MAX_LOG_ENTRIES);
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const filtered = logs.filter(log => log.timestamp > oneWeekAgo);
      
      if (filtered.length !== logs.length) {
        await AsyncStorage.setItem(ErrorHandler.ERROR_LOG_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private reportToAnalytics(errorLog: ErrorLog): void {
    // In a real app, you'd integrate with your analytics service
    // For now, we'll just log to console in development
    if (__DEV__) {
      console.warn('[ErrorHandler]', {
        type: errorLog.type,
        message: errorLog.message,
        platform: errorLog.platform,
        timestamp: new Date(errorLog.timestamp).toISOString(),
      });
    }
    
    // Example integrations:
    // - Firebase Crashlytics
    // - Sentry
    // - Bugsnag
    // - Custom analytics endpoint
  }
}

export type { ErrorLog, UserFriendlyError };