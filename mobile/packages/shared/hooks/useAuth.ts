import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { getSecurityManager } from '../services/security-manager';
import type { 
  AuthUser,
  StudentProfile,
  TeacherProfile,
  SignInCredentials,
  SignInWithBiometricOptions,
} from '../contexts/AuthContext';

// Enhanced auth hook with additional utilities
export const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// Hook for authentication forms
export const useAuthForm = () => {
  const {
    signIn,
    signInWithBiometric,
    signInWithPIN,
    isLoading,
    error,
    clearError,
    canUseBiometric,
    canUsePIN,
  } = useAuth();

  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: '',
    password: '',
    rememberDevice: false,
    useBiometric: false,
  });

  const [pin, setPIN] = useState('');

  const handleSignIn = useCallback(async () => {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }
    await signIn(credentials);
  }, [signIn, credentials]);

  const handleBiometricSignIn = useCallback(async (options?: SignInWithBiometricOptions) => {
    await signInWithBiometric(options);
  }, [signInWithBiometric]);

  const handlePINSignIn = useCallback(async () => {
    if (!pin || pin.length < 4) {
      throw new Error('Valid PIN is required');
    }
    await signInWithPIN(pin);
  }, [signInWithPIN, pin]);

  const resetForm = useCallback(() => {
    setCredentials({
      email: '',
      password: '',
      rememberDevice: false,
      useBiometric: false,
    });
    setPIN('');
    clearError();
  }, [clearError]);

  const updateCredentials = useCallback((updates: Partial<SignInCredentials>) => {
    setCredentials(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    credentials,
    pin,
    setPIN,
    updateCredentials,
    handleSignIn,
    handleBiometricSignIn,
    handlePINSignIn,
    resetForm,
    isLoading,
    error,
    clearError,
    canUseBiometric,
    canUsePIN,
  };
};

// Hook for session management
export const useSession = () => {
  const {
    session,
    isAuthenticated,
    refreshSession,
    updateActivity,
    lastActivity,
    needsReauth,
    retryAuth,
  } = useAuth();

  const [isSessionValid, setIsSessionValid] = useState(true);

  // Check session validity
  useEffect(() => {
    if (!session) {
      setIsSessionValid(false);
      return;
    }

    const checkValidity = () => {
      const now = Date.now();
      const isExpired = session.expiresAt && now >= session.expiresAt;
      const isStale = now - lastActivity > 30 * 60 * 1000; // 30 minutes
      
      setIsSessionValid(!isExpired && !isStale);
    };

    checkValidity();
    const interval = setInterval(checkValidity, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [session, lastActivity]);

  // Auto-refresh session when needed
  useEffect(() => {
    if (session && isAuthenticated && !needsReauth) {
      const timeUntilExpiry = session.expiresAt - Date.now();
      const shouldRefresh = timeUntilExpiry < 15 * 60 * 1000; // 15 minutes before expiry

      if (shouldRefresh) {
        refreshSession();
      }
    }
  }, [session, isAuthenticated, needsReauth, refreshSession]);

  return {
    session,
    isSessionValid,
    isAuthenticated,
    needsReauth,
    refreshSession,
    updateActivity,
    retryAuth,
    timeUntilExpiry: session ? Math.max(0, session.expiresAt - Date.now()) : 0,
  };
};

// Hook for user profile with type safety
export const useUserProfile = () => {
  const { user, isStudent, isTeacher, isAdmin, getStudentProfile, getTeacherProfile } = useAuth();

  const studentProfile = useMemo(() => {
    return isStudent() ? getStudentProfile() : null;
  }, [user, isStudent, getStudentProfile]);

  const teacherProfile = useMemo(() => {
    return isTeacher() ? getTeacherProfile() : null;
  }, [user, isTeacher, getTeacherProfile]);

  return {
    user,
    studentProfile,
    teacherProfile,
    isStudent: isStudent(),
    isTeacher: isTeacher(),
    isAdmin: isAdmin(),
  };
};

// Hook for biometric authentication
export const useBiometric = () => {
  const {
    biometricConfig,
    deviceTrust,
    canUseBiometric,
    setupBiometric,
    signInWithBiometric,
    isLoading,
    error,
  } = useAuth();

  const [biometricInfo, setBiometricInfo] = useState<{
    available: boolean;
    enrolled: boolean;
    securityLevel: 'none' | 'weak' | 'strong';
    warnings: string[];
  } | null>(null);

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const securityManager = getSecurityManager();
        const info = await securityManager.validateBiometricSecurity();
        setBiometricInfo({
          available: info.isAvailable,
          enrolled: info.isEnrolled,
          securityLevel: info.securityLevel,
          warnings: info.warnings,
        });
      } catch (error) {
        console.error('Biometric check failed:', error);
        setBiometricInfo({
          available: false,
          enrolled: false,
          securityLevel: 'none',
          warnings: ['Biometric check failed'],
        });
      }
    };

    checkBiometric();
  }, []);

  const isBiometricSetup = useMemo(() => {
    return Boolean(
      biometricConfig?.enabled &&
      deviceTrust?.trusted &&
      deviceTrust?.biometricEnabled &&
      biometricInfo?.available &&
      biometricInfo?.enrolled
    );
  }, [biometricConfig, deviceTrust, biometricInfo]);

  const handleSetupBiometric = useCallback(async () => {
    if (!biometricInfo?.available) {
      throw new Error('Biometric hardware not available');
    }
    if (!biometricInfo?.enrolled) {
      throw new Error('No biometric data enrolled on device');
    }
    await setupBiometric();
  }, [setupBiometric, biometricInfo]);

  return {
    biometricConfig,
    biometricInfo,
    isBiometricSetup,
    canUseBiometric,
    setupBiometric: handleSetupBiometric,
    signInWithBiometric,
    isLoading,
    error,
  };
};

// Hook for device trust management
export const useDeviceTrust = () => {
  const {
    deviceTrust,
    trustDevice,
    setupPIN,
    signOut,
    isLoading,
    error,
  } = useAuth();

  const [deviceInfo, setDeviceInfo] = useState<{
    fingerprint: any;
    securityEvents: any[];
  } | null>(null);

  // Load device information
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const securityManager = getSecurityManager();
        const [fingerprint, events] = await Promise.all([
          securityManager.getDeviceFingerprint(),
          securityManager.getSecurityEvents(10),
        ]);

        setDeviceInfo({ fingerprint, securityEvents: events });
      } catch (error) {
        console.error('Failed to load device info:', error);
      }
    };

    loadDeviceInfo();
  }, [deviceTrust]);

  const isDeviceTrusted = useMemo(() => {
    return Boolean(deviceTrust?.trusted);
  }, [deviceTrust]);

  const hasPINSetup = useMemo(() => {
    return Boolean(deviceTrust?.pinHash);
  }, [deviceTrust]);

  const handleTrustDevice = useCallback(async () => {
    await trustDevice();
  }, [trustDevice]);

  const handleSetupPIN = useCallback(async (pin: string) => {
    if (pin.length < 4) {
      throw new Error('PIN must be at least 4 digits');
    }
    await setupPIN(pin);
  }, [setupPIN]);

  const handleClearDeviceTrust = useCallback(async () => {
    await signOut(true); // Clear device trust
  }, [signOut]);

  return {
    deviceTrust,
    deviceInfo,
    isDeviceTrusted,
    hasPINSetup,
    trustDevice: handleTrustDevice,
    setupPIN: handleSetupPIN,
    clearDeviceTrust: handleClearDeviceTrust,
    isLoading,
    error,
  };
};

// Hook for offline authentication
export const useOfflineAuth = () => {
  const {
    isOffline,
    enableOfflineAuth,
    isAuthenticated,
    user,
  } = useAuth();

  const [offlineCapability, setOfflineCapability] = useState<{
    enabled: boolean;
    expiresAt: number | null;
  }>({ enabled: false, expiresAt: null });

  // Check offline capability
  useEffect(() => {
    const checkOfflineCapability = async () => {
      // This would check if offline authentication is set up
      // For now, we'll just check if user is authenticated and device is trusted
      setOfflineCapability({
        enabled: isAuthenticated && !isOffline,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      });
    };

    checkOfflineCapability();
  }, [isAuthenticated, isOffline]);

  const handleEnableOfflineAuth = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to enable offline access');
    }
    await enableOfflineAuth();
  }, [isAuthenticated, enableOfflineAuth]);

  return {
    isOffline,
    offlineCapability,
    enableOfflineAuth: handleEnableOfflineAuth,
    isOfflineAuthAvailable: offlineCapability.enabled,
  };
};

// Hook for security monitoring
export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Load security events
  useEffect(() => {
    const loadSecurityEvents = async () => {
      try {
        const securityManager = getSecurityManager();
        const events = await securityManager.getSecurityEvents(20);
        setSecurityEvents(events);

        // Calculate security level based on recent events
        const criticalEvents = events.filter(e => e.severity === 'critical').length;
        const highEvents = events.filter(e => e.severity === 'high').length;

        if (criticalEvents > 0) {
          setSecurityLevel('high');
        } else if (highEvents > 2) {
          setSecurityLevel('high');
        } else if (highEvents > 0) {
          setSecurityLevel('medium');
        } else {
          setSecurityLevel('low');
        }
      } catch (error) {
        console.error('Failed to load security events:', error);
      }
    };

    if (user) {
      loadSecurityEvents();
      const interval = setInterval(loadSecurityEvents, 60 * 1000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Listen for new security events
  useEffect(() => {
    const securityManager = getSecurityManager();
    const unsubscribe = securityManager.addEventListener((event) => {
      setSecurityEvents(prev => [event, ...prev.slice(0, 19)]);
    });

    return unsubscribe;
  }, []);

  return {
    securityEvents,
    securityLevel,
    hasSecurityConcerns: securityLevel === 'high',
    recentCriticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
  };
};

// Hook for app state management with auth
export const useAuthAppState = () => {
  const { updateActivity, needsReauth } = useAuth();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - update activity if authenticated
        updateActivity();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, updateActivity]);

  return {
    appState,
    isAppActive: appState === 'active',
    needsReauth,
  };
};

export default useAuth;