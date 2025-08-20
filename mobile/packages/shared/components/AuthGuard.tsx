import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth, useSession, useAuthAppState } from '../hooks/useAuth';
import type { UserRole } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  requireBiometric?: boolean;
  requireDeviceTrust?: boolean;
  onAuthRequired?: () => void;
  onAccessDenied?: (reason: string) => void;
}

/**
 * Authentication Guard Component
 * Protects routes and components based on authentication status and user roles
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  fallback,
  loadingComponent,
  requireBiometric = false,
  requireDeviceTrust = false,
  onAuthRequired,
  onAccessDenied,
}) => {
  const {
    isAuthenticated,
    isLoading,
    isInitializing,
    user,
    biometricConfig,
    deviceTrust,
    needsReauth,
  } = useAuth();
  
  const { isSessionValid } = useSession();
  const { needsReauth: appNeedsReauth } = useAuthAppState();
  
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);

  // Check access requirements
  useEffect(() => {
    if (!requireAuth) {
      return; // No auth required, allow access
    }

    if (isInitializing || isLoading) {
      return; // Still loading, wait
    }

    // Check basic authentication
    if (!isAuthenticated || !user) {
      setAccessDeniedReason('authentication_required');
      onAuthRequired?.();
      return;
    }

    // Check session validity
    if (!isSessionValid || needsReauth || appNeedsReauth) {
      setAccessDeniedReason('session_expired');
      onAuthRequired?.();
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        const reason = `role_not_allowed:${user.role}`;
        setAccessDeniedReason(reason);
        onAccessDenied?.(reason);
        return;
      }
    }

    // Check biometric requirement
    if (requireBiometric) {
      if (!biometricConfig?.enabled || !deviceTrust?.biometricEnabled) {
        const reason = 'biometric_required';
        setAccessDeniedReason(reason);
        onAccessDenied?.(reason);
        return;
      }
    }

    // Check device trust requirement
    if (requireDeviceTrust) {
      if (!deviceTrust?.trusted) {
        const reason = 'device_trust_required';
        setAccessDeniedReason(reason);
        onAccessDenied?.(reason);
        return;
      }
    }

    // All checks passed
    setAccessDeniedReason(null);
  }, [
    requireAuth,
    isAuthenticated,
    isLoading,
    isInitializing,
    user,
    allowedRoles,
    biometricConfig,
    deviceTrust,
    requireBiometric,
    requireDeviceTrust,
    isSessionValid,
    needsReauth,
    appNeedsReauth,
    onAuthRequired,
    onAccessDenied,
  ]);

  // Show loading state
  if (isInitializing || isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>
          Authenticating...
        </Text>
      </View>
    );
  }

  // Show access denied state
  if (accessDeniedReason) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          Access Denied
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
          {getAccessDeniedMessage(accessDeniedReason)}
        </Text>
      </View>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Get user-friendly message for access denied reasons
 */
function getAccessDeniedMessage(reason: string): string {
  switch (reason) {
    case 'authentication_required':
      return 'Please sign in to access this content.';
    
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    
    case 'biometric_required':
      return 'Biometric authentication is required to access this feature.';
    
    case 'device_trust_required':
      return 'This device must be trusted to access this content.';
    
    default:
      if (reason.startsWith('role_not_allowed:')) {
        const role = reason.split(':')[1];
        return `Your account role (${role}) does not have permission to access this content.`;
      }
      return 'You do not have permission to access this content.';
  }
}

// Role-specific guard components for convenience
export const StudentGuard: React.FC<Omit<AuthGuardProps, 'allowedRoles'>> = (props) => (
  <AuthGuard {...props} allowedRoles={['student']} />
);

export const TeacherGuard: React.FC<Omit<AuthGuardProps, 'allowedRoles'>> = (props) => (
  <AuthGuard {...props} allowedRoles={['teacher']} />
);

export const AdminGuard: React.FC<Omit<AuthGuardProps, 'allowedRoles'>> = (props) => (
  <AuthGuard {...props} allowedRoles={['admin', 'superadmin']} />
);

export const BiometricGuard: React.FC<Omit<AuthGuardProps, 'requireBiometric'>> = (props) => (
  <AuthGuard {...props} requireBiometric={true} />
);

export const TrustedDeviceGuard: React.FC<Omit<AuthGuardProps, 'requireDeviceTrust'>> = (props) => (
  <AuthGuard {...props} requireDeviceTrust={true} />
);

export default AuthGuard;