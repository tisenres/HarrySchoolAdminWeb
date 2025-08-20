import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useReducer, 
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  AuthService, 
  AuthState, 
  AuthUser, 
  StudentProfile, 
  TeacherProfile,
  SignInCredentials,
  SignInWithBiometricOptions,
  getAuthService 
} from '@harry-school/api/services/auth.service';

// Context Types
export interface AuthContextState extends AuthState {
  // Additional UI states
  isInitializing: boolean;
  hasCheckedStoredAuth: boolean;
  canUseBiometric: boolean;
  canUsePIN: boolean;
  needsReauth: boolean;
  lastSignInMethod: 'password' | 'biometric' | 'pin' | null;
}

export interface AuthContextActions {
  // Authentication actions
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signInWithBiometric: (options?: SignInWithBiometricOptions) => Promise<void>;
  signInWithPIN: (pin: string) => Promise<void>;
  signOut: (clearDeviceTrust?: boolean) => Promise<void>;
  
  // Session management
  refreshSession: () => Promise<void>;
  updateActivity: () => void;
  
  // Biometric & Device setup
  setupBiometric: () => Promise<void>;
  setupPIN: (pin: string) => Promise<void>;
  trustDevice: () => Promise<void>;
  
  // Offline authentication
  enableOfflineAuth: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  retryAuth: () => Promise<void>;
  
  // Type guards
  isStudent: () => boolean;
  isTeacher: () => boolean;
  isAdmin: () => boolean;
  
  // Profile getters with proper typing
  getStudentProfile: () => StudentProfile | null;
  getTeacherProfile: () => TeacherProfile | null;
}

export interface AuthContextValue extends AuthContextState, AuthContextActions {}

// Action Types for Reducer
type AuthAction = 
  | { type: 'SET_STATE'; payload: Partial<AuthContextState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_CHECKED_STORED_AUTH'; payload: boolean }
  | { type: 'SET_LAST_SIGNIN_METHOD'; payload: AuthContextState['lastSignInMethod'] }
  | { type: 'SET_NEEDS_REAUTH'; payload: boolean }
  | { type: 'UPDATE_CAPABILITIES'; payload: { canUseBiometric: boolean; canUsePIN: boolean } }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: AuthContextState = {
  // Core auth state
  isAuthenticated: false,
  isLoading: false,
  user: null,
  session: null,
  biometricConfig: null,
  deviceTrust: null,
  lastActivity: Date.now(),
  isOffline: false,
  error: null,
  
  // Additional UI states
  isInitializing: true,
  hasCheckedStoredAuth: false,
  canUseBiometric: false,
  canUsePIN: false,
  needsReauth: false,
  lastSignInMethod: null,
};

// Reducer
function authReducer(state: AuthContextState, action: AuthAction): AuthContextState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };
    
    case 'SET_CHECKED_STORED_AUTH':
      return { ...state, hasCheckedStoredAuth: action.payload };
    
    case 'SET_LAST_SIGNIN_METHOD':
      return { ...state, lastSignInMethod: action.payload };
    
    case 'SET_NEEDS_REAUTH':
      return { ...state, needsReauth: action.payload };
    
    case 'UPDATE_CAPABILITIES':
      return { 
        ...state, 
        canUseBiometric: action.payload.canUseBiometric,
        canUsePIN: action.payload.canUsePIN 
      };
    
    case 'RESET_STATE':
      return { 
        ...initialState, 
        isInitializing: false,
        hasCheckedStoredAuth: true 
      };
    
    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextValue | null>(null);

// Custom hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
  autoSignIn?: boolean;
  enableOfflineMode?: boolean;
}

/**
 * Authentication Provider Component
 * Manages global authentication state and provides auth actions
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  autoSignIn = true,
  enableOfflineMode = true 
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = useRef<AuthService>(getAuthService());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize authentication service and check for stored session
  useEffect(() => {
    initializeAuth();
    
    // Set up app state monitoring
    const appStateSubscription = AppState.addEventListener(
      'change', 
      handleAppStateChange
    );

    // Set up activity monitoring
    setupActivityMonitoring();

    return () => {
      appStateSubscription?.remove();
      clearActivityTimeout();
      authService.current.cleanup();
    };
  }, []);

  // Subscribe to auth service state changes
  useEffect(() => {
    const unsubscribe = authService.current.subscribe((authState) => {
      updateStateFromService(authState);
    });

    return unsubscribe;
  }, []);

  // Auto sign-in effect
  useEffect(() => {
    if (autoSignIn && state.hasCheckedStoredAuth && !state.isAuthenticated && !state.isInitializing) {
      attemptAutoSignIn();
    }
  }, [autoSignIn, state.hasCheckedStoredAuth, state.isAuthenticated, state.isInitializing]);

  // Initialize authentication
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_INITIALIZING', payload: true });
      
      // Update capabilities based on device trust and biometric config
      await updateAuthCapabilities();
      
      // Check for stored session
      const authState = authService.current.getState();
      updateStateFromService(authState);
      
      dispatch({ type: 'SET_CHECKED_STORED_AUTH', payload: true });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to initialize authentication' 
      });
    } finally {
      dispatch({ type: 'SET_INITIALIZING', payload: false });
    }
  }, []);

  // Update state from auth service
  const updateStateFromService = useCallback((authState: AuthState) => {
    dispatch({ 
      type: 'SET_STATE', 
      payload: {
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        user: authState.user,
        session: authState.session,
        biometricConfig: authState.biometricConfig,
        deviceTrust: authState.deviceTrust,
        lastActivity: authState.lastActivity,
        isOffline: authState.isOffline,
        error: authState.error,
      }
    });

    // Handle special error states
    if (authState.error === 'REAUTH_REQUIRED' || authState.error === 'SESSION_EXPIRED') {
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: true });
    }

    // Update capabilities when device trust or biometric config changes
    updateAuthCapabilities();
  }, []);

  // Update authentication capabilities
  const updateAuthCapabilities = useCallback(async () => {
    const authState = authService.current.getState();
    
    const canUseBiometric = Boolean(
      authState.biometricConfig?.enabled && 
      authState.deviceTrust?.trusted && 
      authState.deviceTrust?.biometricEnabled
    );
    
    const canUsePIN = Boolean(
      authState.deviceTrust?.trusted && 
      authState.deviceTrust?.pinHash
    );

    dispatch({ 
      type: 'UPDATE_CAPABILITIES', 
      payload: { canUseBiometric, canUsePIN }
    });
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const previousAppState = appStateRef.current;
    appStateRef.current = nextAppState;

    if (nextAppState === 'active' && previousAppState.match(/inactive|background/)) {
      // App became active - check if reauth is needed
      if (state.isAuthenticated) {
        const needsReauth = authService.current.requiresReauth();
        if (needsReauth) {
          dispatch({ type: 'SET_NEEDS_REAUTH', payload: true });
        } else {
          // Update activity
          authService.current.updateActivity();
        }
      }
    }
  }, [state.isAuthenticated]);

  // Set up activity monitoring
  const setupActivityMonitoring = useCallback(() => {
    const resetActivityTimeout = () => {
      clearActivityTimeout();
      activityTimeoutRef.current = setTimeout(() => {
        if (state.isAuthenticated) {
          dispatch({ type: 'SET_NEEDS_REAUTH', payload: true });
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    resetActivityTimeout();

    // Reset timeout on user activity
    return resetActivityTimeout;
  }, [state.isAuthenticated]);

  const clearActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  // Attempt automatic sign-in
  const attemptAutoSignIn = useCallback(async () => {
    try {
      // Try biometric first if available
      if (state.canUseBiometric) {
        await signInWithBiometric({ promptMessage: 'Welcome back!' });
        dispatch({ type: 'SET_LAST_SIGNIN_METHOD', payload: 'biometric' });
        return;
      }

      // Try offline authentication if enabled
      if (enableOfflineMode) {
        const success = await authService.current.authenticateOffline();
        if (success) {
          dispatch({ type: 'SET_LAST_SIGNIN_METHOD', payload: 'pin' });
          return;
        }
      }

      // If no auto sign-in options available, user needs to sign in manually
    } catch (error) {
      console.warn('Auto sign-in failed:', error);
      // Don't show error for auto sign-in failures
    }
  }, [state.canUseBiometric, enableOfflineMode]);

  // Authentication Actions
  const signIn = useCallback(async (credentials: SignInCredentials) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.signIn(credentials);
      dispatch({ type: 'SET_LAST_SIGNIN_METHOD', payload: 'password' });
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: false });
      
      // Enable offline auth if requested
      if (enableOfflineMode && credentials.rememberDevice) {
        await authService.current.enableOfflineAuth();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      // Error is handled by the auth service state update
    }
  }, [enableOfflineMode]);

  const signInWithBiometric = useCallback(async (options?: SignInWithBiometricOptions) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.signInWithBiometric(options);
      dispatch({ type: 'SET_LAST_SIGNIN_METHOD', payload: 'biometric' });
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: false });
    } catch (error) {
      console.error('Biometric sign in failed:', error);
      // Error is handled by the auth service state update
    }
  }, []);

  const signInWithPIN = useCallback(async (pin: string) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.signInWithPIN(pin);
      dispatch({ type: 'SET_LAST_SIGNIN_METHOD', payload: 'pin' });
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: false });
    } catch (error) {
      console.error('PIN sign in failed:', error);
      // Error is handled by the auth service state update
    }
  }, []);

  const signOut = useCallback(async (clearDeviceTrust: boolean = false) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.signOut(clearDeviceTrust);
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force reset state even if sign out fails
      dispatch({ type: 'RESET_STATE' });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await authService.current.refreshSession();
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  }, []);

  const updateActivity = useCallback(() => {
    authService.current.updateActivity();
    setupActivityMonitoring(); // Reset activity timeout
  }, [setupActivityMonitoring]);

  // Setup Actions
  const setupBiometric = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.setupBiometricAuthentication();
      await updateAuthCapabilities();
    } catch (error) {
      console.error('Biometric setup failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Biometric setup failed' 
      });
    }
  }, []);

  const setupPIN = useCallback(async (pin: string) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.setupPIN(pin);
      await updateAuthCapabilities();
    } catch (error) {
      console.error('PIN setup failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'PIN setup failed' 
      });
    }
  }, []);

  const trustDevice = useCallback(async () => {
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.trustCurrentDevice(state.user);
      await updateAuthCapabilities();
    } catch (error) {
      console.error('Device trust setup failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Device trust setup failed' 
      });
    }
  }, [state.user]);

  const enableOfflineAuth = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await authService.current.enableOfflineAuth();
    } catch (error) {
      console.error('Offline auth setup failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Offline authentication setup failed' 
      });
    }
  }, []);

  // Utility Actions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const retryAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: false });
      
      // Try to re-authenticate with the last successful method
      if (state.lastSignInMethod === 'biometric' && state.canUseBiometric) {
        await signInWithBiometric();
      } else if (state.lastSignInMethod === 'pin' && state.canUsePIN) {
        // PIN retry would need user input, so just clear the reauth flag
        // The UI should handle prompting for PIN
      } else {
        // Fallback to requiring full sign-in
        await signOut();
      }
    } catch (error) {
      console.error('Retry auth failed:', error);
      // Keep reauth flag set if retry fails
      dispatch({ type: 'SET_NEEDS_REAUTH', payload: true });
    }
  }, [state.lastSignInMethod, state.canUseBiometric, state.canUsePIN]);

  // Type Guards
  const isStudent = useCallback((): boolean => {
    return state.user?.role === 'student';
  }, [state.user?.role]);

  const isTeacher = useCallback((): boolean => {
    return state.user?.role === 'teacher';
  }, [state.user?.role]);

  const isAdmin = useCallback((): boolean => {
    return state.user?.role === 'admin' || state.user?.role === 'superadmin';
  }, [state.user?.role]);

  // Profile Getters
  const getStudentProfile = useCallback((): StudentProfile | null => {
    if (!state.user || state.user.role !== 'student') {
      return null;
    }
    return state.user as StudentProfile;
  }, [state.user]);

  const getTeacherProfile = useCallback((): TeacherProfile | null => {
    if (!state.user || state.user.role !== 'teacher') {
      return null;
    }
    return state.user as TeacherProfile;
  }, [state.user]);

  // Context Value
  const contextValue: AuthContextValue = {
    // State
    ...state,
    
    // Actions
    signIn,
    signInWithBiometric,
    signInWithPIN,
    signOut,
    refreshSession,
    updateActivity,
    setupBiometric,
    setupPIN,
    trustDevice,
    enableOfflineAuth,
    clearError,
    retryAuth,
    isStudent,
    isTeacher,
    isAdmin,
    getStudentProfile,
    getTeacherProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export types for external use
export type { 
  AuthState, 
  AuthUser, 
  StudentProfile, 
  TeacherProfile,
  SignInCredentials,
  SignInWithBiometricOptions 
} from '@harry-school/api/services/auth.service';

export default AuthContext;