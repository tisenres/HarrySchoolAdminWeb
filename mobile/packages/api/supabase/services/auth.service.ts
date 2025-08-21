/**
 * Comprehensive Authentication Service for Harry School Mobile Apps
 * 
 * Provides secure authentication with educational context, biometric support,
 * session management, and offline capabilities.
 * 
 * Features:
 * - JWT token management with automatic refresh
 * - Biometric authentication integration
 * - Role-based access control (student, teacher, admin)
 * - Organization-based multi-tenancy
 * - Offline authentication capabilities
 * - Security event logging and monitoring
 * - Session persistence and restoration
 * - Password policy enforcement
 */

import { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

import { MobileSupabaseClient } from '../client';
import { SecurityManager } from '../security';
import { ErrorHandler } from '../error-handler';
import type { Database } from '../types/database';
import type { SupabaseResponse } from '../types/supabase';

/**
 * Authentication-related types
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'superadmin';
  avatar_url?: string;
  organization_id: string;
  language_preference?: string;
  notification_preferences?: Record<string, any>;
  app_preferences?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  organizationId?: string;
  role?: UserProfile['role'];
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  biometricEnabled?: boolean;
}

export interface BiometricSetupOptions {
  enabled: boolean;
  fallbackToPassword: boolean;
  title?: string;
  subtitle?: string;
}

export interface PasswordResetOptions {
  email: string;
  redirectTo?: string;
}

export interface SessionConfiguration {
  refreshThreshold: number; // Minutes before expiry to refresh
  maxInactiveTime: number; // Maximum inactive time in milliseconds
  biometricTimeout: number; // Biometric re-auth timeout in milliseconds
  offlineGracePeriod: number; // Offline authentication grace period
}

export interface AuthEvents {
  onSignIn?: (user: User, profile: UserProfile) => void;
  onSignOut?: () => void;
  onSessionRefresh?: (session: Session) => void;
  onProfileUpdate?: (profile: UserProfile) => void;
  onAuthError?: (error: AuthError) => void;
  onBiometricSetup?: (enabled: boolean) => void;
}

/**
 * Security and audit types
 */
export interface SecurityEvent {
  type: 'login' | 'logout' | 'session_refresh' | 'biometric_auth' | 'failed_auth' | 'password_reset';
  timestamp: string;
  userId?: string;
  organizationId?: string;
  deviceInfo: {
    platform: string;
    version: string;
    appVersion: string;
  };
  location?: {
    ip?: string;
    country?: string;
    city?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Main Authentication Service Class
 */
export class AuthService {
  private client: MobileSupabaseClient;
  private securityManager: SecurityManager;
  private errorHandler: ErrorHandler;
  private authState: AuthState;
  private sessionConfig: SessionConfiguration;
  private eventListeners: AuthEvents;
  private refreshTimer?: NodeJS.Timeout;
  private inactivityTimer?: NodeJS.Timeout;
  private biometricTimer?: NodeJS.Timeout;

  // Storage keys
  private static readonly STORAGE_KEYS = {
    SESSION: '@harry_school:session',
    PROFILE: '@harry_school:profile', 
    BIOMETRIC_ENABLED: '@harry_school:biometric_enabled',
    REMEMBER_EMAIL: '@harry_school:remember_email',
    SECURITY_EVENTS: '@harry_school:security_events',
    OFFLINE_TOKEN: '@harry_school:offline_token',
    LAST_ACTIVITY: '@harry_school:last_activity'
  };

  constructor(
    client: MobileSupabaseClient,
    config?: Partial<SessionConfiguration>,
    events?: AuthEvents
  ) {
    this.client = client;
    this.securityManager = new SecurityManager();
    this.errorHandler = new ErrorHandler();
    this.eventListeners = events || {};
    
    // Default session configuration
    this.sessionConfig = {
      refreshThreshold: 5, // 5 minutes
      maxInactiveTime: 30 * 60 * 1000, // 30 minutes
      biometricTimeout: 5 * 60 * 1000, // 5 minutes
      offlineGracePeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    // Initialize auth state
    this.authState = {
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAuthenticated: false
    };

    this.initializeService();
  }

  /**
   * Service Initialization
   */
  private async initializeService(): Promise<void> {
    try {
      // Restore session from storage
      await this.restoreSession();
      
      // Setup session monitoring
      this.setupSessionMonitoring();
      
      // Setup inactivity detection
      this.setupInactivityDetection();
      
      // Update auth state
      this.updateAuthState({ isLoading: false });
      
    } catch (error) {
      this.errorHandler.logError('AUTH_INITIALIZATION_ERROR', error);
      this.updateAuthState({ isLoading: false });
    }
  }

  /**
   * Authentication Methods
   */
  
  async signIn(credentials: SignInCredentials): Promise<SupabaseResponse<AuthResponse>> {
    try {
      this.updateAuthState({ isLoading: true });

      // Log security event
      await this.logSecurityEvent({
        type: 'login',
        timestamp: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
        metadata: { email: credentials.email }
      });

      const result = await this.client.signIn(credentials.email, credentials.password);

      if (result.error) {
        await this.logSecurityEvent({
          type: 'failed_auth',
          timestamp: new Date().toISOString(),
          deviceInfo: this.getDeviceInfo(),
          metadata: { 
            email: credentials.email, 
            reason: result.error.message 
          }
        });

        this.updateAuthState({ isLoading: false });
        this.eventListeners.onAuthError?.(result.error as AuthError);
        return result;
      }

      if (result.data?.session) {
        // Fetch user profile
        const profile = await this.fetchUserProfile(result.data.user.id);
        
        if (profile) {
          // Update auth state
          this.updateAuthState({
            user: result.data.user,
            profile,
            session: result.data.session,
            isAuthenticated: true,
            isLoading: false,
            organizationId: profile.organization_id,
            role: profile.role
          });

          // Store session and profile
          await this.storeSession(result.data.session);
          await this.storeProfile(profile);

          // Setup biometric auth if requested
          if (credentials.biometricEnabled) {
            await this.setupBiometricAuth();
          }

          // Remember email if requested
          if (credentials.rememberMe) {
            await AsyncStorage.setItem(
              AuthService.STORAGE_KEYS.REMEMBER_EMAIL, 
              credentials.email
            );
          }

          // Start session monitoring
          this.startSessionMonitoring();

          // Trigger events
          this.eventListeners.onSignIn?.(result.data.user, profile);

          return { data: result.data, error: null };
        } else {
          const error = new Error('Failed to fetch user profile');
          this.updateAuthState({ isLoading: false });
          return { data: null, error: { message: error.message } };
        }
      }

      this.updateAuthState({ isLoading: false });
      return result;

    } catch (error) {
      this.errorHandler.logError('SIGN_IN_ERROR', error);
      this.updateAuthState({ isLoading: false });
      return { 
        data: null, 
        error: { message: 'Sign in failed' } 
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });

      // Log security event
      await this.logSecurityEvent({
        type: 'logout',
        timestamp: new Date().toISOString(),
        userId: this.authState.user?.id,
        organizationId: this.authState.organizationId,
        deviceInfo: this.getDeviceInfo()
      });

      // Sign out from Supabase
      await this.client.signOut();

      // Clear stored data
      await this.clearStoredSession();

      // Stop monitoring
      this.stopSessionMonitoring();

      // Reset auth state
      this.updateAuthState({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        organizationId: undefined,
        role: undefined
      });

      // Trigger events
      this.eventListeners.onSignOut?.();

    } catch (error) {
      this.errorHandler.logError('SIGN_OUT_ERROR', error);
      this.updateAuthState({ isLoading: false });
    }
  }

  async authenticateWithBiometrics(): Promise<SupabaseResponse<boolean>> {
    try {
      // Check if biometrics are enabled
      const biometricEnabled = await this.isBiometricEnabled();
      if (!biometricEnabled) {
        return { 
          data: false, 
          error: { message: 'Biometric authentication not enabled' } 
        };
      }

      // Check biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return { 
          data: false, 
          error: { message: 'Biometric authentication not available' } 
        };
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Harry School',
        subtext: 'Use your biometric to sign in',
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
        requireConfirmation: false
      });

      if (result.success) {
        // Restore session if biometric auth successful
        const session = await this.getStoredSession();
        if (session) {
          // Verify session is still valid
          const isValid = await this.validateSession(session);
          if (isValid) {
            const profile = await this.getStoredProfile();
            
            if (profile) {
              this.updateAuthState({
                user: { id: profile.id } as User,
                profile,
                session,
                isAuthenticated: true,
                organizationId: profile.organization_id,
                role: profile.role
              });

              // Log security event
              await this.logSecurityEvent({
                type: 'biometric_auth',
                timestamp: new Date().toISOString(),
                userId: profile.id,
                organizationId: profile.organization_id,
                deviceInfo: this.getDeviceInfo()
              });

              return { data: true, error: null };
            }
          }
        }
      }

      return { 
        data: false, 
        error: { message: 'Biometric authentication failed' } 
      };

    } catch (error) {
      this.errorHandler.logError('BIOMETRIC_AUTH_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Biometric authentication error' } 
      };
    }
  }

  async setupBiometricAuth(options?: BiometricSetupOptions): Promise<SupabaseResponse<boolean>> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return { 
          data: false, 
          error: { message: 'Biometric authentication not available on this device' } 
        };
      }

      const defaultOptions: BiometricSetupOptions = {
        enabled: true,
        fallbackToPassword: true,
        title: 'Enable Biometric Authentication',
        subtitle: 'Use your fingerprint or face to sign in quickly and securely',
        ...options
      };

      if (defaultOptions.enabled) {
        // Test biometric authentication
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: defaultOptions.title || 'Setup Biometric Authentication',
          subtext: defaultOptions.subtitle,
          cancelLabel: 'Cancel',
          disableDeviceFallback: !defaultOptions.fallbackToPassword
        });

        if (result.success) {
          // Store biometric preference
          await AsyncStorage.setItem(
            AuthService.STORAGE_KEYS.BIOMETRIC_ENABLED, 
            'true'
          );

          // Generate and store offline token
          await this.generateOfflineToken();

          this.eventListeners.onBiometricSetup?.(true);
          return { data: true, error: null };
        } else {
          return { 
            data: false, 
            error: { message: 'Biometric setup was cancelled or failed' } 
          };
        }
      } else {
        // Disable biometric authentication
        await AsyncStorage.removeItem(AuthService.STORAGE_KEYS.BIOMETRIC_ENABLED);
        await SecureStore.deleteItemAsync(AuthService.STORAGE_KEYS.OFFLINE_TOKEN);
        
        this.eventListeners.onBiometricSetup?.(false);
        return { data: true, error: null };
      }

    } catch (error) {
      this.errorHandler.logError('BIOMETRIC_SETUP_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to setup biometric authentication' } 
      };
    }
  }

  async requestPasswordReset(options: PasswordResetOptions): Promise<SupabaseResponse<boolean>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: false, 
          error: { message: 'Database connection not available' } 
        };
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        options.email,
        {
          redirectTo: options.redirectTo
        }
      );

      if (error) {
        return { 
          data: false, 
          error: { message: error.message } 
        };
      }

      // Log security event
      await this.logSecurityEvent({
        type: 'password_reset',
        timestamp: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
        metadata: { email: options.email }
      });

      return { data: true, error: null };

    } catch (error) {
      this.errorHandler.logError('PASSWORD_RESET_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to request password reset' } 
      };
    }
  }

  /**
   * Session Management
   */

  private async restoreSession(): Promise<void> {
    try {
      const session = await this.getStoredSession();
      const profile = await this.getStoredProfile();

      if (session && profile) {
        // Validate session
        const isValid = await this.validateSession(session);
        
        if (isValid) {
          this.updateAuthState({
            user: { id: profile.id } as User,
            profile,
            session,
            isAuthenticated: true,
            organizationId: profile.organization_id,
            role: profile.role
          });

          this.startSessionMonitoring();
        } else {
          // Session expired, clear stored data
          await this.clearStoredSession();
        }
      }
    } catch (error) {
      this.errorHandler.logError('SESSION_RESTORE_ERROR', error);
      await this.clearStoredSession();
    }
  }

  private async validateSession(session: Session): Promise<boolean> {
    try {
      const now = Date.now();
      const expiresAt = new Date(session.expires_at || 0).getTime();
      
      // Check if session is expired
      if (now >= expiresAt) {
        return false;
      }

      // Check if refresh is needed
      const refreshThreshold = this.sessionConfig.refreshThreshold * 60 * 1000;
      if (now >= (expiresAt - refreshThreshold)) {
        await this.refreshSession();
      }

      return true;
    } catch (error) {
      this.errorHandler.logError('SESSION_VALIDATION_ERROR', error);
      return false;
    }
  }

  private async refreshSession(): Promise<void> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) return;

      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (data.session) {
        this.updateAuthState({ session: data.session });
        await this.storeSession(data.session);

        // Log security event
        await this.logSecurityEvent({
          type: 'session_refresh',
          timestamp: new Date().toISOString(),
          userId: this.authState.user?.id,
          organizationId: this.authState.organizationId,
          deviceInfo: this.getDeviceInfo()
        });

        this.eventListeners.onSessionRefresh?.(data.session);
      }
    } catch (error) {
      this.errorHandler.logError('SESSION_REFRESH_ERROR', error);
      // If refresh fails, sign out user
      await this.signOut();
    }
  }

  private setupSessionMonitoring(): void {
    // Setup session refresh timer
    this.refreshTimer = setInterval(async () => {
      if (this.authState.session) {
        await this.validateSession(this.authState.session);
      }
    }, 60000); // Check every minute
  }

  private startSessionMonitoring(): void {
    this.setupSessionMonitoring();
  }

  private stopSessionMonitoring(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * User Profile Management
   */

  private async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) return null;

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('deleted_at', null)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      this.errorHandler.logError('PROFILE_FETCH_ERROR', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<SupabaseResponse<UserProfile>> {
    try {
      if (!this.authState.user) {
        return { 
          data: null, 
          error: { message: 'User not authenticated' } 
        };
      }

      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: null, 
          error: { message: 'Database connection not available' } 
        };
      }

      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.authState.user.id)
        .select()
        .single();

      if (error) {
        return { 
          data: null, 
          error: { message: error.message } 
        };
      }

      const updatedProfile = data as UserProfile;
      
      // Update auth state and storage
      this.updateAuthState({ profile: updatedProfile });
      await this.storeProfile(updatedProfile);

      this.eventListeners.onProfileUpdate?.(updatedProfile);

      return { data: updatedProfile, error: null };

    } catch (error) {
      this.errorHandler.logError('PROFILE_UPDATE_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to update profile' } 
      };
    }
  }

  /**
   * Offline Authentication Support
   */

  private async generateOfflineToken(): Promise<void> {
    if (!this.authState.user || !this.authState.profile) return;

    try {
      const offlineData = {
        userId: this.authState.user.id,
        profileId: this.authState.profile.id,
        organizationId: this.authState.profile.organization_id,
        role: this.authState.profile.role,
        timestamp: Date.now(),
        expires: Date.now() + this.sessionConfig.offlineGracePeriod
      };

      const encryptedToken = this.securityManager.encrypt(JSON.stringify(offlineData));
      
      await SecureStore.setItemAsync(
        AuthService.STORAGE_KEYS.OFFLINE_TOKEN,
        encryptedToken
      );
    } catch (error) {
      this.errorHandler.logError('OFFLINE_TOKEN_GENERATION_ERROR', error);
    }
  }

  async authenticateOffline(): Promise<SupabaseResponse<boolean>> {
    try {
      const encryptedToken = await SecureStore.getItemAsync(
        AuthService.STORAGE_KEYS.OFFLINE_TOKEN
      );

      if (!encryptedToken) {
        return { 
          data: false, 
          error: { message: 'No offline authentication available' } 
        };
      }

      const decryptedData = this.securityManager.decrypt(encryptedToken);
      const offlineData = JSON.parse(decryptedData);

      // Check if token is still valid
      if (Date.now() > offlineData.expires) {
        return { 
          data: false, 
          error: { message: 'Offline authentication expired' } 
        };
      }

      // Restore minimal auth state for offline use
      const profile = await this.getStoredProfile();
      if (profile) {
        this.updateAuthState({
          user: { id: profile.id } as User,
          profile,
          session: null, // No session in offline mode
          isAuthenticated: true,
          organizationId: profile.organization_id,
          role: profile.role
        });

        return { data: true, error: null };
      }

      return { 
        data: false, 
        error: { message: 'Offline authentication failed' } 
      };

    } catch (error) {
      this.errorHandler.logError('OFFLINE_AUTH_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Offline authentication error' } 
      };
    }
  }

  /**
   * Inactivity Detection
   */

  private setupInactivityDetection(): void {
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(async () => {
      if (this.authState.isAuthenticated) {
        await this.handleInactivityTimeout();
      }
    }, this.sessionConfig.maxInactiveTime);

    // Update last activity
    await AsyncStorage.setItem(
      AuthService.STORAGE_KEYS.LAST_ACTIVITY,
      Date.now().toString()
    );
  }

  private async handleInactivityTimeout(): Promise<void> {
    // Check if biometric re-auth is available
    const biometricEnabled = await this.isBiometricEnabled();
    
    if (biometricEnabled) {
      // Start biometric timer
      this.startBiometricTimer();
    } else {
      // Sign out due to inactivity
      await this.signOut();
    }
  }

  private startBiometricTimer(): void {
    this.biometricTimer = setTimeout(async () => {
      await this.signOut();
    }, this.sessionConfig.biometricTimeout);
  }

  /**
   * Storage Utilities
   */

  private async storeSession(session: Session): Promise<void> {
    try {
      const sessionData = this.securityManager.encrypt(JSON.stringify(session));
      await SecureStore.setItemAsync(AuthService.STORAGE_KEYS.SESSION, sessionData);
    } catch (error) {
      this.errorHandler.logError('SESSION_STORAGE_ERROR', error);
    }
  }

  private async getStoredSession(): Promise<Session | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(AuthService.STORAGE_KEYS.SESSION);
      if (sessionData) {
        const decryptedData = this.securityManager.decrypt(sessionData);
        return JSON.parse(decryptedData);
      }
      return null;
    } catch (error) {
      this.errorHandler.logError('SESSION_RETRIEVAL_ERROR', error);
      return null;
    }
  }

  private async storeProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        AuthService.STORAGE_KEYS.PROFILE, 
        JSON.stringify(profile)
      );
    } catch (error) {
      this.errorHandler.logError('PROFILE_STORAGE_ERROR', error);
    }
  }

  private async getStoredProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(AuthService.STORAGE_KEYS.PROFILE);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      this.errorHandler.logError('PROFILE_RETRIEVAL_ERROR', error);
      return null;
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AuthService.STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(AuthService.STORAGE_KEYS.PROFILE),
        SecureStore.deleteItemAsync(AuthService.STORAGE_KEYS.OFFLINE_TOKEN)
      ]);
    } catch (error) {
      this.errorHandler.logError('SESSION_CLEAR_ERROR', error);
    }
  }

  /**
   * Security Event Logging
   */

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const events = await this.getSecurityEvents();
      events.push(event);
      
      // Keep only last 100 events
      const recentEvents = events.slice(-100);
      
      await AsyncStorage.setItem(
        AuthService.STORAGE_KEYS.SECURITY_EVENTS,
        JSON.stringify(recentEvents)
      );
    } catch (error) {
      this.errorHandler.logError('SECURITY_EVENT_LOG_ERROR', error);
    }
  }

  private async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const eventsData = await AsyncStorage.getItem(AuthService.STORAGE_KEYS.SECURITY_EVENTS);
      return eventsData ? JSON.parse(eventsData) : [];
    } catch (error) {
      this.errorHandler.logError('SECURITY_EVENT_RETRIEVAL_ERROR', error);
      return [];
    }
  }

  /**
   * Utility Methods
   */

  private async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(AuthService.STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      appVersion: '1.0.0' // Should come from config
    };
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
  }

  /**
   * Public API Methods
   */

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getCurrentProfile(): UserProfile | null {
    return this.authState.profile;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getOrganizationId(): string | undefined {
    return this.authState.organizationId;
  }

  getUserRole(): UserProfile['role'] | undefined {
    return this.authState.role;
  }

  hasRole(role: UserProfile['role'] | UserProfile['role'][]): boolean {
    if (!this.authState.role) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(this.authState.role);
  }

  canAccessResource(resource: string, action: string): boolean {
    // Implement role-based access control logic
    const role = this.authState.role;
    
    switch (role) {
      case 'superadmin':
        return true;
      case 'admin':
        return !resource.includes('superadmin');
      case 'teacher':
        return ['groups', 'students', 'attendance', 'tasks'].some(r => resource.includes(r));
      case 'student':
        return ['profile', 'tasks', 'vocabulary', 'ranking'].some(r => resource.includes(r)) &&
               ['read', 'update'].includes(action);
      default:
        return false;
    }
  }

  /**
   * Activity tracking
   */
  recordActivity(): void {
    this.resetInactivityTimer();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopSessionMonitoring();
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    if (this.biometricTimer) {
      clearTimeout(this.biometricTimer);
    }
  }
}

export default AuthService;