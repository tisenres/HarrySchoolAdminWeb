import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

interface SecureConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  encryptionKey?: string;
}

interface SecurityEvent {
  type: string;
  timestamp: number;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SessionSecurity {
  deviceId: string;
  sessionStart: number;
  lastActivity: number;
  loginAttempts: number;
  maxInactivity: number;
  requiresReauth: boolean;
}

/**
 * Security manager for mobile Supabase client
 * Handles secure token storage, session management, and security monitoring
 */
export class SecurityManager {
  private static readonly CONFIG_KEY = '@harry-school:secure-config';
  private static readonly SESSION_KEY = '@harry-school:session-security';
  private static readonly SECURITY_LOG_KEY = '@harry-school:security-events';
  private static readonly DEVICE_ID_KEY = '@harry-school:device-id';
  
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
  private static readonly MAX_INACTIVE_TIME = 30 * 60 * 1000; // 30 minutes
  private static readonly SECURITY_LOG_LIMIT = 200;

  private deviceId: string | null = null;
  private sessionSecurity: SessionSecurity | null = null;
  private securityEventListeners: Set<(event: SecurityEvent) => void> = new Set();

  constructor() {
    this.initializeSecurity();
  }

  private async initializeSecurity(): Promise<void> {
    await this.ensureDeviceId();
    await this.loadSessionSecurity();
    this.startSecurityMonitoring();
  }

  /**
   * Get secure configuration with validation
   */
  async getSecureConfig(): Promise<SecureConfig> {
    try {
      // In production, these would come from secure storage or environment
      const config = await this.getEnvironmentConfig();
      
      // Validate configuration
      await this.validateConfiguration(config);
      
      return config;
    } catch (error) {
      await this.logSecurityEvent('CONFIG_ERROR', { error: error.message }, 'high');
      throw new Error('Failed to load secure configuration');
    }
  }

  /**
   * Handle successful sign-in
   */
  async onSignIn(session: any): Promise<void> {
    try {
      // Reset login attempts
      if (this.sessionSecurity) {
        this.sessionSecurity.loginAttempts = 0;
      }

      // Create new session security context
      this.sessionSecurity = {
        deviceId: await this.getDeviceId(),
        sessionStart: Date.now(),
        lastActivity: Date.now(),
        loginAttempts: 0,
        maxInactivity: SecurityManager.MAX_INACTIVE_TIME,
        requiresReauth: false,
      };

      await this.saveSessionSecurity();
      
      // Log successful authentication
      await this.logSecurityEvent('SIGNIN_SUCCESS', {
        userId: session?.user?.id,
        deviceId: this.deviceId,
        platform: Platform.OS,
      }, 'low');

      // Validate session integrity
      await this.validateSession(session);

    } catch (error) {
      await this.logSecurityEvent('SIGNIN_ERROR', { error: error.message }, 'high');
      throw error;
    }
  }

  /**
   * Handle sign-out
   */
  async onSignOut(): Promise<void> {
    try {
      if (this.sessionSecurity) {
        const sessionDuration = Date.now() - this.sessionSecurity.sessionStart;
        
        await this.logSecurityEvent('SIGNOUT_SUCCESS', {
          sessionDuration,
          deviceId: this.deviceId,
        }, 'low');
      }

      // Clear session security
      this.sessionSecurity = null;
      await AsyncStorage.removeItem(SecurityManager.SESSION_KEY);

      // Clear sensitive data
      await this.clearSensitiveData();

    } catch (error) {
      await this.logSecurityEvent('SIGNOUT_ERROR', { error: error.message }, 'medium');
    }
  }

  /**
   * Handle token refresh
   */
  async onTokenRefresh(session: any): Promise<void> {
    try {
      // Update last activity
      await this.updateActivity();
      
      // Validate refreshed session
      await this.validateSession(session);
      
      await this.logSecurityEvent('TOKEN_REFRESH', {
        userId: session?.user?.id,
        deviceId: this.deviceId,
      }, 'low');

    } catch (error) {
      await this.logSecurityEvent('TOKEN_REFRESH_ERROR', { error: error.message }, 'high');
      throw error;
    }
  }

  /**
   * Check if current session is valid and secure
   */
  async validateCurrentSession(): Promise<boolean> {
    if (!this.sessionSecurity) return false;

    const now = Date.now();
    
    // Check session timeout
    if (now - this.sessionSecurity.sessionStart > SecurityManager.SESSION_TIMEOUT) {
      await this.logSecurityEvent('SESSION_TIMEOUT', {
        sessionAge: now - this.sessionSecurity.sessionStart,
      }, 'medium');
      this.sessionSecurity.requiresReauth = true;
      await this.saveSessionSecurity();
      return false;
    }

    // Check inactivity timeout
    if (now - this.sessionSecurity.lastActivity > this.sessionSecurity.maxInactivity) {
      await this.logSecurityEvent('INACTIVITY_TIMEOUT', {
        inactiveTime: now - this.sessionSecurity.lastActivity,
      }, 'medium');
      this.sessionSecurity.requiresReauth = true;
      await this.saveSessionSecurity();
      return false;
    }

    return true;
  }

  /**
   * Update user activity timestamp
   */
  async updateActivity(): Promise<void> {
    if (this.sessionSecurity) {
      this.sessionSecurity.lastActivity = Date.now();
      await this.saveSessionSecurity();
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(error: any): Promise<void> {
    if (!this.sessionSecurity) {
      this.sessionSecurity = {
        deviceId: await this.getDeviceId(),
        sessionStart: Date.now(),
        lastActivity: Date.now(),
        loginAttempts: 0,
        maxInactivity: SecurityManager.MAX_INACTIVE_TIME,
        requiresReauth: false,
      };
    }

    this.sessionSecurity.loginAttempts++;
    await this.saveSessionSecurity();

    await this.logSecurityEvent('LOGIN_FAILED', {
      attempt: this.sessionSecurity.loginAttempts,
      error: error.message,
      deviceId: this.deviceId,
    }, this.sessionSecurity.loginAttempts >= 3 ? 'high' : 'medium');

    // Implement progressive delays for repeated failures
    if (this.sessionSecurity.loginAttempts >= SecurityManager.MAX_LOGIN_ATTEMPTS) {
      await this.logSecurityEvent('MAX_LOGIN_ATTEMPTS', {
        attempts: this.sessionSecurity.loginAttempts,
        deviceId: this.deviceId,
      }, 'critical');
      
      // Could implement device temporary lockout here
      throw new Error('Too many failed login attempts. Please try again later.');
    }
  }

  /**
   * Get device fingerprint for security validation
   */
  async getDeviceFingerprint(): Promise<string> {
    const deviceId = await this.getDeviceId();
    const platform = Platform.OS;
    const version = Platform.Version;
    
    // Create a basic device fingerprint
    const fingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${deviceId}-${platform}-${version}`
    );
    
    return fingerprint;
  }

  /**
   * Validate API request for security
   */
  async validateApiRequest(request: {
    method: string;
    endpoint: string;
    data?: any;
  }): Promise<boolean> {
    try {
      // Check session validity
      const isSessionValid = await this.validateCurrentSession();
      if (!isSessionValid) {
        await this.logSecurityEvent('INVALID_SESSION_REQUEST', {
          method: request.method,
          endpoint: request.endpoint,
        }, 'high');
        return false;
      }

      // Update activity
      await this.updateActivity();

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(request);

      return true;
    } catch (error) {
      await this.logSecurityEvent('REQUEST_VALIDATION_ERROR', {
        error: error.message,
        request,
      }, 'medium');
      return false;
    }
  }

  /**
   * Get security events for monitoring
   */
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(SecurityManager.SECURITY_LOG_KEY);
      const events: SecurityEvent[] = stored ? JSON.parse(stored) : [];
      return events.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Clear security logs
   */
  async clearSecurityLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SecurityManager.SECURITY_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear security logs:', error);
    }
  }

  /**
   * Subscribe to security events
   */
  addEventListener(listener: (event: SecurityEvent) => void): () => void {
    this.securityEventListeners.add(listener);
    return () => this.securityEventListeners.delete(listener);
  }

  // Private helper methods

  private async getEnvironmentConfig(): Promise<SecureConfig> {
    // In a production app, these would be loaded from:
    // - React Native Config for environment variables
    // - Secure storage like Keychain (iOS) or Keystore (Android)
    // - Remote config with certificate pinning
    
    return {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
  }

  private async validateConfiguration(config: SecureConfig): Promise<void> {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // Validate URL format
    try {
      new URL(config.supabaseUrl);
    } catch {
      throw new Error('Invalid Supabase URL format');
    }

    // Validate API key format (basic check)
    if (!config.supabaseAnonKey.match(/^eyJ[A-Za-z0-9-_]+/)) {
      throw new Error('Invalid Supabase API key format');
    }
  }

  private async validateSession(session: any): Promise<void> {
    if (!session?.user?.id) {
      throw new Error('Invalid session: missing user ID');
    }

    if (!session?.access_token) {
      throw new Error('Invalid session: missing access token');
    }

    // Check token expiration
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      throw new Error('Session token has expired');
    }
  }

  private async ensureDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem(SecurityManager.DEVICE_ID_KEY);
      
      if (!deviceId) {
        // Generate a new device ID
        deviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}-${Platform.OS}`
        );
        await AsyncStorage.setItem(SecurityManager.DEVICE_ID_KEY, deviceId);
      }
      
      this.deviceId = deviceId;
    } catch (error) {
      // Fallback to a session-based ID
      this.deviceId = `session-${Date.now()}-${Math.random().toString(36)}`;
    }
  }

  private async getDeviceId(): Promise<string> {
    if (!this.deviceId) {
      await this.ensureDeviceId();
    }
    return this.deviceId!;
  }

  private async loadSessionSecurity(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SecurityManager.SESSION_KEY);
      if (stored) {
        this.sessionSecurity = JSON.parse(stored);
      }
    } catch (error) {
      // Initialize new session security if loading fails
      this.sessionSecurity = null;
    }
  }

  private async saveSessionSecurity(): Promise<void> {
    try {
      if (this.sessionSecurity) {
        await AsyncStorage.setItem(
          SecurityManager.SESSION_KEY, 
          JSON.stringify(this.sessionSecurity)
        );
      }
    } catch (error) {
      await this.logSecurityEvent('SESSION_SAVE_ERROR', { error: error.message }, 'medium');
    }
  }

  private async clearSensitiveData(): Promise<void> {
    try {
      // Clear any cached sensitive data
      const sensitiveKeys = [
        '@harry-school:auth-token',
        '@harry-school:user-profile',
        '@harry-school:sensitive-cache',
      ];

      await Promise.all(
        sensitiveKeys.map(key => AsyncStorage.removeItem(key))
      );
    } catch (error) {
      await this.logSecurityEvent('DATA_CLEAR_ERROR', { error: error.message }, 'medium');
    }
  }

  private async detectSuspiciousActivity(request: any): Promise<void> {
    // Implement basic suspicious activity detection
    // In a real app, you'd have more sophisticated detection logic

    const now = Date.now();
    const recentEvents = (await this.getSecurityEvents(20))
      .filter(event => now - event.timestamp < 60000); // Last minute

    // Check for rapid requests
    const rapidRequests = recentEvents.filter(
      event => event.type === 'API_REQUEST'
    ).length;

    if (rapidRequests > 50) {
      await this.logSecurityEvent('RAPID_REQUESTS_DETECTED', {
        requestCount: rapidRequests,
        timeFrame: '1 minute',
      }, 'high');
    }

    // Add more detection rules as needed
  }

  private startSecurityMonitoring(): void {
    // Periodic security checks
    setInterval(async () => {
      if (this.sessionSecurity) {
        await this.validateCurrentSession();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async logSecurityEvent(
    type: string, 
    details: any, 
    severity: SecurityEvent['severity']
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        type,
        timestamp: Date.now(),
        details,
        severity,
      };

      // Store the event
      const existing = await this.getSecurityEvents(SecurityManager.SECURITY_LOG_LIMIT - 1);
      const updated = [...existing, event];
      await AsyncStorage.setItem(SecurityManager.SECURITY_LOG_KEY, JSON.stringify(updated));

      // Notify listeners
      this.securityEventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in security event listener:', error);
        }
      });

      // Log critical events to console in development
      if (__DEV__ && severity === 'critical') {
        console.warn('[SecurityManager] Critical event:', event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export type { SecureConfig, SecurityEvent, SessionSecurity };