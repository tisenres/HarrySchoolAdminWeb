# Harry School Mobile Authentication System

A comprehensive, secure authentication architecture for React Native mobile applications with biometric authentication, device trust management, and offline capabilities.

## Overview

This authentication system provides:

- **Multi-factor Authentication**: Password, biometric (fingerprint/face), and PIN-based authentication
- **Role-based Access Control**: Student, teacher, and admin role support with granular permissions
- **Device Trust Management**: Secure device fingerprinting and trust establishment
- **Offline Authentication**: Secure offline mode with time-limited access
- **Session Management**: Automatic token refresh, activity monitoring, and session validation
- **Security Monitoring**: Real-time threat detection and security event logging
- **Cross-platform Support**: iOS and Android with platform-specific optimizations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Mobile Application                        │
├─────────────────────────────────────────────────────────────────┤
│  Components: AuthGuard, SignInScreen, BiometricSetup          │
├─────────────────────────────────────────────────────────────────┤
│  Hooks: useAuth, useAuthForm, useBiometric, useSession        │
├─────────────────────────────────────────────────────────────────┤
│  Context: AuthProvider (Global State Management)               │
├─────────────────────────────────────────────────────────────────┤
│  Services: AuthService, MobileSecurityManager                 │
├─────────────────────────────────────────────────────────────────┤
│  Storage: SecureStore, AsyncStorage, MMKV                     │
├─────────────────────────────────────────────────────────────────┤
│  Backend: Supabase (PostgreSQL + RLS + Real-time)            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. AuthService (`@harry-school/api/services/auth.service.ts`)

The main authentication service handling all authentication flows:

```typescript
import { getAuthService } from '@harry-school/api/services/auth.service';

const authService = getAuthService();

// Sign in with email/password
await authService.signIn({
  email: 'student@school.com',
  password: 'password123',
  rememberDevice: true,
  useBiometric: true
});

// Sign in with biometric
await authService.signInWithBiometric({
  promptMessage: 'Authenticate to sign in',
  fallbackLabel: 'Use Password'
});

// Sign in with PIN (teachers)
await authService.signInWithPIN('1234');
```

### 2. AuthProvider (`@harry-school/shared/contexts/AuthContext.tsx`)

Global authentication context providing state and actions:

```typescript
import { AuthProvider, useAuth } from '@harry-school/shared';

// Wrap your app
<AuthProvider autoSignIn={true} enableOfflineMode={true}>
  <App />
</AuthProvider>

// Use in components
const { 
  isAuthenticated, 
  user, 
  signIn, 
  signOut,
  isStudent,
  isTeacher 
} = useAuth();
```

### 3. MobileSecurityManager (`@harry-school/shared/services/security-manager.ts`)

Advanced security features including device fingerprinting and threat detection:

```typescript
import { getSecurityManager } from '@harry-school/shared/services/security-manager';

const securityManager = getSecurityManager();

// Get device fingerprint
const fingerprint = await securityManager.getDeviceFingerprint();

// Encrypt sensitive data
const encrypted = await securityManager.encryptToken(token);

// Monitor security events
securityManager.addEventListener((event) => {
  console.log('Security event:', event);
});
```

## Authentication Flows

### Student Authentication Flow

1. **Initial Sign-in**: Email/password with device trust setup
2. **Biometric Setup**: Fingerprint/Face ID enrollment (optional)
3. **Future Access**: Automatic biometric authentication
4. **Fallback**: PIN or password if biometric fails

```typescript
// Student-specific authentication
const StudentApp = () => {
  return (
    <StudentGuard>
      <StudentTabs />
    </StudentGuard>
  );
};
```

### Teacher Authentication Flow

1. **Initial Sign-in**: Email/password with device trust
2. **PIN Setup**: 4-6 digit PIN for quick access
3. **Future Access**: PIN or biometric authentication
4. **Administrative Features**: Additional verification for sensitive actions

```typescript
// Teacher-specific authentication
const TeacherApp = () => {
  return (
    <TeacherGuard>
      <TrustedDeviceGuard>
        <TeacherTabs />
      </TrustedDeviceGuard>
    </TeacherGuard>
  );
};
```

## Security Features

### Device Trust Management

- **Device Fingerprinting**: Unique device identification
- **Trust Establishment**: Secure device registration
- **Cross-device Sync**: Manage trusted devices across accounts
- **Automatic Revocation**: Remove trust on suspicious activity

### Biometric Authentication

- **Platform Support**: Touch ID, Face ID, Fingerprint
- **Fallback Options**: PIN or password when biometric fails
- **Security Levels**: Different requirements based on data sensitivity
- **Enrollment Flow**: Guided setup with user education

### Offline Authentication

- **Time-limited Access**: Configurable offline duration (default: 24 hours)
- **Secure Storage**: Encrypted offline credentials
- **Sync on Reconnection**: Automatic sync when online
- **Limited Functionality**: Reduced features in offline mode

## Usage Examples

### Basic Setup

```typescript
// App.tsx
import { AuthProvider } from '@harry-school/shared';

export default function App() {
  return (
    <AuthProvider
      autoSignIn={true}
      enableOfflineMode={true}
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
```

### Protected Routes

```typescript
// Navigation.tsx
import { AuthGuard, StudentGuard, BiometricGuard } from '@harry-school/shared';

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthFlow} />
      ) : (
        <Stack.Screen name="Main" component={MainApp} />
      )}
    </Stack.Navigator>
  );
};

// Protected student content
const StudentDashboard = () => (
  <StudentGuard>
    <BiometricGuard requireBiometric={true}>
      <SensitiveStudentContent />
    </BiometricGuard>
  </StudentGuard>
);
```

### Authentication Forms

```typescript
// SignInScreen.tsx
import { useAuthForm } from '@harry-school/shared';

const CustomSignIn = () => {
  const {
    credentials,
    updateCredentials,
    handleSignIn,
    handleBiometricSignIn,
    isLoading,
    error,
    canUseBiometric
  } = useAuthForm();

  return (
    <View>
      <TextInput
        value={credentials.email}
        onChangeText={(email) => updateCredentials({ email })}
        placeholder="Email"
      />
      
      <TextInput
        value={credentials.password}
        onChangeText={(password) => updateCredentials({ password })}
        placeholder="Password"
        secureTextEntry
      />

      <Button onPress={handleSignIn} title="Sign In" />
      
      {canUseBiometric && (
        <Button 
          onPress={() => handleBiometricSignIn()} 
          title="Use Biometric" 
        />
      )}
    </View>
  );
};
```

### Security Monitoring

```typescript
// SecurityMonitor.tsx
import { useSecurityMonitoring } from '@harry-school/shared';

const SecurityMonitor = () => {
  const { 
    securityEvents, 
    securityLevel, 
    hasSecurityConcerns 
  } = useSecurityMonitoring();

  if (hasSecurityConcerns) {
    return (
      <Alert 
        severity={securityLevel}
        message={`${securityEvents.length} security events detected`}
      />
    );
  }

  return null;
};
```

## Configuration

### Environment Variables

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Security Configuration
EXPO_PUBLIC_ENABLE_ROOT_DETECTION=true
EXPO_PUBLIC_ENABLE_EMULATOR_DETECTION=true
EXPO_PUBLIC_SESSION_TIMEOUT=14400000
EXPO_PUBLIC_MAX_OFFLINE_TIME=86400000
```

### Security Configuration

```typescript
// Configure security manager
import { getSecurityManager } from '@harry-school/shared';

const securityManager = getSecurityManager({
  enableDeviceFingerprinting: true,
  enableBiometricFallback: true,
  maxFailedAttempts: 5,
  sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
  requireSecureNetwork: false,
  enableRootDetection: true,
  enableEmulatorDetection: true,
  logSecurityEvents: true,
  encryptStoredTokens: true,
});
```

## Testing

### Unit Tests

```typescript
// __tests__/auth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@harry-school/shared';

describe('useAuth', () => {
  it('should handle sign in', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/auth-flow.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignInScreen } from '@harry-school/shared';

describe('SignInScreen', () => {
  it('should complete sign in flow', async () => {
    const onSignInSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SignInScreen onSignInSuccess={onSignInSuccess} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(onSignInSuccess).toHaveBeenCalled();
    });
  });
});
```

## Security Considerations

### Data Protection

- **Encryption**: All sensitive data encrypted at rest and in transit
- **Secure Storage**: Platform-specific secure storage (Keychain/Keystore)
- **Token Management**: Automatic token rotation and secure refresh
- **Biometric Data**: Never stored, only used for local verification

### Threat Mitigation

- **Root/Jailbreak Detection**: Automatic detection and warnings
- **Emulator Detection**: Prevent usage on emulated devices
- **Network Security**: TLS pinning and certificate validation
- **Session Management**: Automatic timeout and activity monitoring

### Compliance

- **GDPR**: User consent and data minimization
- **COPPA**: Age verification for student accounts
- **SOC 2**: Security controls and monitoring
- **Privacy**: No biometric data storage, local verification only

## Troubleshooting

### Common Issues

1. **Biometric Setup Fails**
   - Ensure device has biometric hardware
   - Verify biometric data is enrolled in device settings
   - Check app permissions for biometric access

2. **Session Expires Frequently**
   - Check network connectivity
   - Verify token refresh configuration
   - Review activity timeout settings

3. **Device Trust Issues**
   - Clear app data and re-establish trust
   - Check device fingerprint consistency
   - Verify secure storage availability

### Debug Mode

```typescript
// Enable debug logging
const authService = getAuthService();
authService.enableDebugMode(true);

// Monitor security events
const securityManager = getSecurityManager();
securityManager.addEventListener((event) => {
  if (event.severity === 'critical') {
    console.warn('Critical security event:', event);
  }
});
```

## Migration Guide

### From Basic Auth

1. Install authentication packages
2. Wrap app with AuthProvider
3. Replace auth logic with hooks
4. Update navigation guards
5. Test all authentication flows

### Database Updates

```sql
-- Add mobile-specific columns to profiles table
ALTER TABLE profiles ADD COLUMN app_preferences JSONB;
ALTER TABLE profiles ADD COLUMN language_preference VARCHAR(10);

-- Create device trust tracking
CREATE TABLE device_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  device_id VARCHAR(255) NOT NULL,
  trusted_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Optimization

### Caching Strategy

- **User Profile**: Cache with 1-hour TTL
- **Session Data**: Real-time updates
- **Security Events**: Local storage with periodic sync
- **Biometric Config**: Device-specific persistence

### Bundle Size

- **Tree Shaking**: Remove unused authentication features
- **Code Splitting**: Load biometric features on demand
- **Native Modules**: Platform-specific implementations

## Support

For technical support or questions:

1. Check the troubleshooting section
2. Review example implementations
3. Submit issues with detailed logs
4. Include device and platform information

## License

This authentication system is part of the Harry School CRM project and is proprietary software. All rights reserved.