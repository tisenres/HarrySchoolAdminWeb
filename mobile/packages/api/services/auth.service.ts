import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getMobileSupabaseClient, MobileSupabaseClient } from '../supabase/client';
import { SecurityManager } from '../supabase/security';
import type { Database } from '../types/database';

export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  languagePreference?: string;
  notificationPreferences?: any;
  appPreferences?: any;
}

export interface StudentProfile extends AuthUser {
  role: 'student';
  groupIds: string[];
  rankingPoints: number;
  rankingCoins: number;
  level: number;
  referralCode: string;
  referralsCount: number;
}

export interface TeacherProfile extends AuthUser {
  role: 'teacher';
  specializations: string[];
  groupIds: string[];
  rankingPoints: number;
  level: number;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
  deviceTrusted: boolean;
}

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'voice';
  fallbackToPIN: boolean;
}

export interface DeviceTrust {
  deviceId: string;
  deviceName: string;
  trusted: boolean;
  trustedAt?: number;
  lastUsed: number;
  biometricEnabled: boolean;
  pinHash?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  biometricConfig: BiometricConfig | null;
  deviceTrust: DeviceTrust | null;
  lastActivity: number;
  isOffline: boolean;
  error: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberDevice?: boolean;
  useBiometric?: boolean;
}

export interface SignInWithBiometricOptions {
  promptMessage?: string;
  fallbackLabel?: string;
}

export interface SessionRefreshOptions {
  force?: boolean;
  backgroundRefresh?: boolean;
}

/**
 * Comprehensive authentication service for Harry School mobile apps
 * Supports both student (biometric) and teacher (PIN/password) authentication
 */
export class AuthService {
  private static readonly SECURE_STORE_KEYS = {
    SESSION: 'harry_school_session',
    BIOMETRIC_CONFIG: 'harry_school_biometric',
    DEVICE_TRUST: 'harry_school_device_trust',
    PIN_HASH: 'harry_school_pin_hash',
    OFFLINE_AUTH: 'harry_school_offline_auth',
  };

  private static readonly STORAGE_KEYS = {
    LAST_USER: '@harry-school:last-user',
    APP_PREFERENCES: '@harry-school:app-preferences',
    DEVICE_SETTINGS: '@harry-school:device-settings',
  };

  private static readonly SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
  private static readonly REFRESH_THRESHOLD = 15 * 60 * 1000; // Refresh 15 min before expiry
  private static readonly MAX_OFFLINE_TIME = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_BIOMETRIC_ATTEMPTS = 3;
  private static readonly MAX_PIN_ATTEMPTS = 5;

  private supabaseClient: MobileSupabaseClient | null = null;
  private securityManager: SecurityManager;
  private currentState: AuthState;
  private stateListeners: Set<(state: AuthState) => void> = new Set();
  private sessionRefreshTimer: NodeJS.Timeout | null = null;
  private appStateListener: any = null;
  private biometricAttempts = 0;
  private pinAttempts = 0;
  private lastBackgroundTime: number | null = null;

  constructor() {
    this.securityManager = new SecurityManager();
    this.currentState = this.getInitialState();
    this.initializeService();
  }

  private getInitialState(): AuthState {
    return {
      isAuthenticated: false,
      isLoading: true,
      user: null,
      session: null,
      biometricConfig: null,
      deviceTrust: null,
      lastActivity: Date.now(),
      isOffline: false,
      error: null,
    };
  }

  private async initializeService(): Promise<void> {
    try {
      // Initialize Supabase client
      this.supabaseClient = getMobileSupabaseClient();
      
      if (!this.supabaseClient) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Load existing session
      await this.loadStoredSession();
      
      // Load device trust and biometric config
      await this.loadDeviceConfiguration();
      
      // Set up app state handling
      this.setupAppStateHandling();
      
      // Set up periodic session validation
      this.setupSessionValidation();

      this.updateState({ isLoading: false });
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      this.updateState({ 
        isLoading: false, 
        error: 'Failed to initialize authentication service' 
      });
    }
  }

  // Public Authentication Methods

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    try {
      if (!this.supabaseClient) {
        throw new Error('Authentication service not initialized');
      }

      // Validate credentials
      this.validateCredentials(credentials);

      // Attempt sign-in with Supabase
      const { data, error } = await this.supabaseClient.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        await this.handleSignInError(error);
        return;
      }

      if (!data.session || !data.user) {
        throw new Error('Invalid authentication response');
      }

      // Get user profile from database
      const userProfile = await this.fetchUserProfile(data.user.id);
      
      // Create auth session
      const authSession = await this.createAuthSession(data.session, userProfile);
      
      // Handle device trust
      if (credentials.rememberDevice) {
        await this.trustCurrentDevice(userProfile);
      }

      // Set up biometric authentication for students
      if (userProfile.role === 'student' && credentials.useBiometric) {
        await this.setupBiometricAuthentication();
      }

      // Store session securely
      await this.storeSession(authSession);
      
      // Update state
      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        user: userProfile,
        session: authSession,
        lastActivity: Date.now(),
        error: null,
      });

      // Set up auto-refresh
      this.setupSessionRefresh();

      // Reset attempt counters
      this.biometricAttempts = 0;
      this.pinAttempts = 0;

    } catch (error) {
      console.error('Sign in failed:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      });
    }
  }

  /**
   * Sign in with biometric authentication (students only)
   */
  async signInWithBiometric(options: SignInWithBiometricOptions = {}): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    try {
      // Check if biometric is available and configured
      const biometricConfig = await this.getBiometricConfig();
      if (!biometricConfig?.enabled) {
        throw new Error('Biometric authentication not enabled');
      }

      // Check device trust
      const deviceTrust = await this.getDeviceTrust();
      if (!deviceTrust?.trusted || !deviceTrust?.biometricEnabled) {
        throw new Error('Device not trusted for biometric authentication');
      }

      // Check attempt limits
      if (this.biometricAttempts >= AuthService.MAX_BIOMETRIC_ATTEMPTS) {
        throw new Error('Too many biometric attempts. Please use password instead.');
      }

      // Prompt for biometric authentication
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Authenticate to access your account',
        fallbackLabel: options.fallbackLabel || 'Use Password',
        disableDeviceFallback: !biometricConfig.fallbackToPIN,
      });

      if (!biometricResult.success) {
        this.biometricAttempts++;
        if (biometricResult.error === 'UserCancel') {
          throw new Error('Biometric authentication cancelled');
        } else if (biometricResult.error === 'UserFallback') {
          // Handle fallback to PIN/password
          throw new Error('FALLBACK_REQUIRED');
        } else {
          throw new Error('Biometric authentication failed');
        }
      }

      // Load stored session for biometric authentication
      const storedSession = await this.loadStoredSession();
      if (!storedSession) {
        throw new Error('No stored session found. Please sign in with password.');
      }

      // Validate stored session
      await this.validateStoredSession(storedSession);

      // Refresh session if needed
      const refreshedSession = await this.refreshSessionIfNeeded(storedSession);

      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        user: refreshedSession.user,
        session: refreshedSession,
        lastActivity: Date.now(),
        error: null,
      });

      // Reset attempt counter on success
      this.biometricAttempts = 0;

    } catch (error) {
      console.error('Biometric sign in failed:', error);
      
      let errorMessage = 'Biometric authentication failed';
      if (error instanceof Error) {
        if (error.message === 'FALLBACK_REQUIRED') {
          errorMessage = 'FALLBACK_REQUIRED';
        } else {
          errorMessage = error.message;
        }
      }

      this.updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
    }
  }

  /**
   * Sign in with PIN (teachers) or fallback authentication
   */
  async signInWithPIN(pin: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    try {
      // Check attempt limits
      if (this.pinAttempts >= AuthService.MAX_PIN_ATTEMPTS) {
        throw new Error('Too many PIN attempts. Please wait and try again.');
      }

      // Validate PIN against stored hash
      const isValidPIN = await this.validatePIN(pin);
      if (!isValidPIN) {
        this.pinAttempts++;
        throw new Error('Invalid PIN');
      }

      // Load stored session
      const storedSession = await this.loadStoredSession();
      if (!storedSession) {
        throw new Error('No stored session found. Please sign in with password.');
      }

      // Validate and refresh session
      await this.validateStoredSession(storedSession);
      const refreshedSession = await this.refreshSessionIfNeeded(storedSession);

      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        user: refreshedSession.user,
        session: refreshedSession,
        lastActivity: Date.now(),
        error: null,
      });

      // Reset attempt counter
      this.pinAttempts = 0;

    } catch (error) {
      console.error('PIN sign in failed:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'PIN authentication failed' 
      });
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(clearDeviceTrust: boolean = false): Promise<void> {
    this.updateState({ isLoading: true });

    try {
      // Sign out from Supabase
      if (this.supabaseClient) {
        await this.supabaseClient.signOut();
      }

      // Clear session data
      await this.clearSession();

      // Optionally clear device trust
      if (clearDeviceTrust) {
        await this.clearDeviceTrust();
      }

      // Clear auto-refresh
      this.clearSessionRefresh();

      // Reset state
      this.updateState({
        ...this.getInitialState(),
        isLoading: false,
      });

    } catch (error) {
      console.error('Sign out failed:', error);
      // Still update state even if sign out partially failed
      this.updateState({
        ...this.getInitialState(),
        isLoading: false,
        error: 'Sign out completed with warnings',
      });
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession(options: SessionRefreshOptions = {}): Promise<void> {
    if (!this.currentState.session || !this.supabaseClient) {
      return;
    }

    try {
      if (!options.backgroundRefresh) {
        this.updateState({ isLoading: true });
      }

      const { data, error } = await this.supabaseClient.getSession();
      
      if (error) {
        throw error;
      }

      if (data.session) {
        // Update session with new tokens
        const updatedSession: AuthSession = {
          ...this.currentState.session,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || this.currentState.session.refreshToken,
          expiresAt: data.session.expires_at || this.currentState.session.expiresAt,
        };

        await this.storeSession(updatedSession);
        
        this.updateState({
          session: updatedSession,
          lastActivity: Date.now(),
          isLoading: false,
        });
      }

    } catch (error) {
      console.error('Session refresh failed:', error);
      if (!options.backgroundRefresh) {
        this.updateState({ isLoading: false });
      }
      
      // If refresh fails, consider signing out
      if (error && (error as any).status === 401) {
        await this.signOut();
      }
    }
  }

  // Biometric & Device Trust Methods

  /**
   * Set up biometric authentication for students
   */
  async setupBiometricAuthentication(): Promise<void> {
    try {
      // Check device biometric capabilities
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        throw new Error('Biometric hardware not available');
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.length === 0) {
        throw new Error('No biometric authentication methods available');
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        throw new Error('No biometric data enrolled on device');
      }

      // Determine biometric type
      let biometricType: BiometricConfig['type'] = 'fingerprint';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      // Create biometric configuration
      const biometricConfig: BiometricConfig = {
        enabled: true,
        type: biometricType,
        fallbackToPIN: true,
      };

      // Store configuration
      await SecureStore.setItemAsync(
        AuthService.SECURE_STORE_KEYS.BIOMETRIC_CONFIG,
        JSON.stringify(biometricConfig)
      );

      // Update device trust
      const deviceTrust = await this.getDeviceTrust();
      if (deviceTrust) {
        deviceTrust.biometricEnabled = true;
        await this.updateDeviceTrust(deviceTrust);
      }

      this.updateState({ biometricConfig });

    } catch (error) {
      console.error('Biometric setup failed:', error);
      throw error;
    }
  }

  /**
   * Trust current device
   */
  async trustCurrentDevice(user: AuthUser): Promise<void> {
    try {
      const deviceId = await this.securityManager.getDeviceFingerprint();
      const deviceName = `${Platform.OS} ${Platform.Version}`;

      const deviceTrust: DeviceTrust = {
        deviceId,
        deviceName,
        trusted: true,
        trustedAt: Date.now(),
        lastUsed: Date.now(),
        biometricEnabled: false,
      };

      await this.updateDeviceTrust(deviceTrust);
      this.updateState({ deviceTrust });

    } catch (error) {
      console.error('Device trust setup failed:', error);
      throw error;
    }
  }

  /**
   * Set up PIN for quick authentication
   */
  async setupPIN(pin: string): Promise<void> {
    try {
      // Hash the PIN securely
      const pinHash = await this.hashPIN(pin);
      
      // Store PIN hash securely
      await SecureStore.setItemAsync(
        AuthService.SECURE_STORE_KEYS.PIN_HASH,
        pinHash
      );

      // Update device trust
      const deviceTrust = await this.getDeviceTrust();
      if (deviceTrust) {
        deviceTrust.pinHash = pinHash;
        await this.updateDeviceTrust(deviceTrust);
      }

    } catch (error) {
      console.error('PIN setup failed:', error);
      throw error;
    }
  }

  // Offline Authentication Methods

  /**
   * Enable offline authentication
   */
  async enableOfflineAuth(): Promise<void> {
    if (!this.currentState.session) {
      throw new Error('No active session to enable offline auth');
    }

    try {
      const offlineAuthData = {
        userId: this.currentState.user!.id,
        userEmail: this.currentState.user!.email,
        role: this.currentState.user!.role,
        enabledAt: Date.now(),
        deviceId: await this.securityManager.getDeviceFingerprint(),
      };

      await SecureStore.setItemAsync(
        AuthService.SECURE_STORE_KEYS.OFFLINE_AUTH,
        JSON.stringify(offlineAuthData)
      );

    } catch (error) {
      console.error('Failed to enable offline auth:', error);
      throw error;
    }
  }

  /**
   * Authenticate offline using stored credentials
   */
  async authenticateOffline(): Promise<boolean> {
    try {
      const offlineData = await SecureStore.getItemAsync(
        AuthService.SECURE_STORE_KEYS.OFFLINE_AUTH
      );

      if (!offlineData) {
        return false;
      }

      const parsedData = JSON.parse(offlineData);
      const now = Date.now();

      // Check if offline auth is still valid (24 hours)
      if (now - parsedData.enabledAt > AuthService.MAX_OFFLINE_TIME) {
        await this.clearOfflineAuth();
        return false;
      }

      // Verify device fingerprint
      const currentDeviceId = await this.securityManager.getDeviceFingerprint();
      if (parsedData.deviceId !== currentDeviceId) {
        return false;
      }

      // Create minimal user object for offline mode
      const offlineUser: AuthUser = {
        id: parsedData.userId,
        email: parsedData.userEmail,
        name: 'Offline User',
        role: parsedData.role,
        organizationId: 'offline',
      };

      this.updateState({
        isAuthenticated: true,
        user: offlineUser,
        isOffline: true,
        lastActivity: now,
      });

      return true;

    } catch (error) {
      console.error('Offline authentication failed:', error);
      return false;
    }
  }

  // State Management

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Update user activity timestamp
   */
  updateActivity(): void {
    if (this.currentState.isAuthenticated) {
      this.updateState({ lastActivity: Date.now() });
      this.securityManager.updateActivity();
    }
  }

  /**
   * Check if user needs re-authentication
   */
  requiresReauth(): boolean {
    if (!this.currentState.isAuthenticated || !this.currentState.session) {
      return true;
    }

    const now = Date.now();
    const sessionAge = now - this.currentState.session.issuedAt;
    const inactiveTime = now - this.currentState.lastActivity;

    return (
      sessionAge > AuthService.SESSION_TIMEOUT ||
      inactiveTime > (30 * 60 * 1000) // 30 minutes inactive
    );
  }

  // Private Helper Methods

  private updateState(updates: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.stateListeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  private validateCredentials(credentials: SignInCredentials): void {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    if (!credentials.email.includes('@')) {
      throw new Error('Invalid email format');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  private async handleSignInError(error: any): Promise<void> {
    // Record failed login attempt
    await this.securityManager.recordFailedLogin(error);
    
    // Determine appropriate error message
    let message = 'Sign in failed';
    
    if (error.message?.includes('Invalid login credentials')) {
      message = 'Invalid email or password';
    } else if (error.message?.includes('Email not confirmed')) {
      message = 'Please verify your email address';
    } else if (error.message?.includes('Too many requests')) {
      message = 'Too many attempts. Please try again later.';
    }
    
    throw new Error(message);
  }

  private async fetchUserProfile(userId: string): Promise<AuthUser> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await this.supabaseClient.query(
      client => client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    );

    if (error || !data) {
      throw new Error('Failed to fetch user profile');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      organizationId: data.organization_id,
      avatarUrl: data.avatar_url || undefined,
      languagePreference: data.language_preference || undefined,
      notificationPreferences: data.notification_preferences || undefined,
      appPreferences: data.app_preferences || undefined,
    };
  }

  private async createAuthSession(
    supabaseSession: any,
    user: AuthUser
  ): Promise<AuthSession> {
    return {
      user,
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at * 1000, // Convert to milliseconds
      issuedAt: Date.now(),
      deviceTrusted: false,
    };
  }

  private async storeSession(session: AuthSession): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        AuthService.SECURE_STORE_KEYS.SESSION,
        JSON.stringify(session)
      );

      // Store last user info for quick access
      await AsyncStorage.setItem(
        AuthService.STORAGE_KEYS.LAST_USER,
        JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        })
      );

    } catch (error) {
      console.error('Failed to store session:', error);
      throw error;
    }
  }

  private async loadStoredSession(): Promise<AuthSession | null> {
    try {
      const storedSession = await SecureStore.getItemAsync(
        AuthService.SECURE_STORE_KEYS.SESSION
      );

      if (!storedSession) {
        return null;
      }

      return JSON.parse(storedSession);
    } catch (error) {
      console.error('Failed to load stored session:', error);
      return null;
    }
  }

  private async validateStoredSession(session: AuthSession): Promise<void> {
    const now = Date.now();
    
    // Check if session is expired
    if (session.expiresAt && now >= session.expiresAt) {
      throw new Error('Session has expired');
    }

    // Check session age
    if (now - session.issuedAt > AuthService.SESSION_TIMEOUT) {
      throw new Error('Session is too old');
    }
  }

  private async refreshSessionIfNeeded(session: AuthSession): Promise<AuthSession> {
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;

    // Refresh if within threshold
    if (timeUntilExpiry < AuthService.REFRESH_THRESHOLD) {
      await this.refreshSession({ force: true });
      return this.currentState.session || session;
    }

    return session;
  }

  private async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AuthService.SECURE_STORE_KEYS.SESSION);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  private async getBiometricConfig(): Promise<BiometricConfig | null> {
    try {
      const stored = await SecureStore.getItemAsync(
        AuthService.SECURE_STORE_KEYS.BIOMETRIC_CONFIG
      );
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async getDeviceTrust(): Promise<DeviceTrust | null> {
    try {
      const stored = await SecureStore.getItemAsync(
        AuthService.SECURE_STORE_KEYS.DEVICE_TRUST
      );
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async updateDeviceTrust(deviceTrust: DeviceTrust): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        AuthService.SECURE_STORE_KEYS.DEVICE_TRUST,
        JSON.stringify(deviceTrust)
      );
    } catch (error) {
      console.error('Failed to update device trust:', error);
    }
  }

  private async clearDeviceTrust(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AuthService.SECURE_STORE_KEYS.DEVICE_TRUST);
      await SecureStore.deleteItemAsync(AuthService.SECURE_STORE_KEYS.BIOMETRIC_CONFIG);
      await SecureStore.deleteItemAsync(AuthService.SECURE_STORE_KEYS.PIN_HASH);
    } catch (error) {
      console.error('Failed to clear device trust:', error);
    }
  }

  private async clearOfflineAuth(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AuthService.SECURE_STORE_KEYS.OFFLINE_AUTH);
    } catch (error) {
      console.error('Failed to clear offline auth:', error);
    }
  }

  private async loadDeviceConfiguration(): Promise<void> {
    const [biometricConfig, deviceTrust] = await Promise.all([
      this.getBiometricConfig(),
      this.getDeviceTrust(),
    ]);

    this.updateState({ biometricConfig, deviceTrust });
  }

  private async hashPIN(pin: string): Promise<string> {
    // In a production app, use a more secure hashing algorithm
    // This is a simplified implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'harry_school_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async validatePIN(pin: string): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(
        AuthService.SECURE_STORE_KEYS.PIN_HASH
      );
      
      if (!storedHash) {
        return false;
      }

      const pinHash = await this.hashPIN(pin);
      return pinHash === storedHash;
    } catch {
      return false;
    }
  }

  private setupAppStateHandling(): void {
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      this.lastBackgroundTime = Date.now();
    } else if (nextAppState === 'active' && this.lastBackgroundTime) {
      const backgroundDuration = Date.now() - this.lastBackgroundTime;
      
      // Require re-auth if app was in background for too long
      if (backgroundDuration > 15 * 60 * 1000 && this.currentState.isAuthenticated) {
        this.updateState({ error: 'REAUTH_REQUIRED' });
      }
      
      this.lastBackgroundTime = null;
    }
  }

  private setupSessionRefresh(): void {
    this.clearSessionRefresh();
    
    // Set up periodic refresh
    this.sessionRefreshTimer = setInterval(() => {
      if (this.currentState.session) {
        this.refreshSession({ backgroundRefresh: true });
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private clearSessionRefresh(): void {
    if (this.sessionRefreshTimer) {
      clearInterval(this.sessionRefreshTimer);
      this.sessionRefreshTimer = null;
    }
  }

  private setupSessionValidation(): void {
    // Periodic session validation
    setInterval(() => {
      if (this.currentState.isAuthenticated && this.requiresReauth()) {
        this.updateState({ error: 'SESSION_EXPIRED' });
      }
    }, 60 * 1000); // Every minute
  }

  // Cleanup
  cleanup(): void {
    this.clearSessionRefresh();
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    this.stateListeners.clear();
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

export default AuthService;