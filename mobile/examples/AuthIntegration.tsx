/**
 * Authentication Integration Examples for Harry School Mobile Apps
 * 
 * This file demonstrates how to integrate the authentication system
 * into Student and Teacher mobile applications.
 */

import React, { useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AuthProvider,
  useAuth,
  useUserProfile,
  useAuthForm,
  useSession,
  useSecurityMonitoring,
  useOfflineAuth,
  AuthGuard,
  StudentGuard,
  TeacherGuard,
  BiometricGuard,
  TrustedDeviceGuard,
  SignInScreen,
  BiometricSetupScreen,
} from '@harry-school/shared';

// Navigation Types
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BiometricSetup: undefined;
};

type AuthStackParamList = {
  SignIn: undefined;
  ForgotPassword: undefined;
};

type StudentTabParamList = {
  Dashboard: undefined;
  HomeTasks: undefined;
  Vocabulary: undefined;
  Schedule: undefined;
  Ranking: undefined;
};

type TeacherTabParamList = {
  Dashboard: undefined;
  Groups: undefined;
  Attendance: undefined;
  Schedule: undefined;
  Analytics: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();
const TeacherTab = createBottomTabNavigator<TeacherTabParamList>();

// =============================================================================
// 1. APP ROOT WITH AUTHENTICATION PROVIDER
// =============================================================================

/**
 * Main App Component with Authentication Provider
 * This wraps your entire app and provides authentication context
 */
export const App: React.FC = () => {
  return (
    <AuthProvider
      autoSignIn={true}           // Auto-attempt biometric signin
      enableOfflineMode={true}    // Enable offline authentication
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

// =============================================================================
// 2. ROOT NAVIGATOR WITH AUTHENTICATION FLOW
// =============================================================================

/**
 * Root Navigator that handles authentication flow
 */
const AppNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isInitializing,
    needsReauth,
    biometricConfig,
    user,
  } = useAuth();

  // Show loading screen during initialization
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated || needsReauth ? (
        // Authentication Flow
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !biometricConfig?.enabled && user?.role === 'student' ? (
        // Biometric Setup for Students (optional)
        <RootStack.Screen name="BiometricSetup" component={BiometricSetupFlow} />
      ) : (
        // Main Application
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// =============================================================================
// 3. AUTHENTICATION NAVIGATOR
// =============================================================================

/**
 * Authentication Flow Navigator
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInFlow} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * Sign In Flow with integrated SignInScreen
 */
const SignInFlow: React.FC = () => {
  return (
    <SignInScreen
      onSignInSuccess={() => {
        // Navigation is handled by AppNavigator automatically
        // You can add additional logic here if needed
      }}
      onForgotPassword={() => {
        // Handle forgot password navigation
        console.log('Navigate to forgot password');
      }}
      showBiometricOption={true}
      showRememberDevice={true}
    />
  );
};

// =============================================================================
// 4. BIOMETRIC SETUP FLOW
// =============================================================================

/**
 * Biometric Setup Flow (typically for students)
 */
const BiometricSetupFlow: React.FC = () => {
  return (
    <BiometricSetupScreen
      onSetupComplete={() => {
        // Navigation handled automatically
      }}
      onSkip={() => {
        // User skipped biometric setup
        // Navigation handled automatically
      }}
      showSkipOption={true}
    />
  );
};

// =============================================================================
// 5. MAIN APPLICATION NAVIGATOR (ROLE-BASED)
// =============================================================================

/**
 * Main Application Navigator - routes based on user role
 */
const MainNavigator: React.FC = () => {
  const { isStudent, isTeacher } = useUserProfile();

  if (isStudent) {
    return <StudentApplication />;
  } else if (isTeacher) {
    return <TeacherApplication />;
  } else {
    return <UnsupportedRoleScreen />;
  }
};

// =============================================================================
// 6. STUDENT APPLICATION
// =============================================================================

/**
 * Student Application with protected routes
 */
const StudentApplication: React.FC = () => {
  return (
    <StudentGuard>
      <StudentTab.Navigator>
        <StudentTab.Screen name="Dashboard" component={StudentDashboard} />
        <StudentTab.Screen name="HomeTasks" component={StudentHomeTasks} />
        <StudentTab.Screen name="Vocabulary" component={StudentVocabulary} />
        <StudentTab.Screen name="Schedule" component={StudentSchedule} />
        <StudentTab.Screen name="Ranking" component={StudentRanking} />
      </StudentTab.Navigator>
    </StudentGuard>
  );
};

/**
 * Example Student Dashboard with Authentication Integration
 */
const StudentDashboard: React.FC = () => {
  const { updateActivity } = useAuth();
  const { studentProfile } = useUserProfile();
  const { isSessionValid, timeUntilExpiry } = useSession();

  // Update activity when user interacts with dashboard
  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Welcome, {studentProfile?.name}!
      </Text>
      
      <Text style={{ fontSize: 16, marginTop: 8 }}>
        Level: {studentProfile?.level}
      </Text>
      
      <Text style={{ fontSize: 16 }}>
        Points: {studentProfile?.rankingPoints}
      </Text>
      
      <Text style={{ fontSize: 16 }}>
        Coins: {studentProfile?.rankingCoins}
      </Text>

      {/* Session Status */}
      <View style={{ marginTop: 20, padding: 12, backgroundColor: '#f0f0f0' }}>
        <Text>Session Valid: {isSessionValid ? 'Yes' : 'No'}</Text>
        <Text>Time Until Expiry: {Math.floor(timeUntilExpiry / 60000)} minutes</Text>
      </View>

      {/* Biometric Guard Example */}
      <BiometricGuard
        fallback={
          <Text style={{ marginTop: 16, color: 'orange' }}>
            Biometric authentication required for sensitive features
          </Text>
        }
      >
        <TouchableOpacity style={{ marginTop: 16, padding: 12, backgroundColor: 'green' }}>
          <Text style={{ color: 'white' }}>Access Sensitive Feature</Text>
        </TouchableOpacity>
      </BiometricGuard>
    </View>
  );
};

// =============================================================================
// 7. TEACHER APPLICATION
// =============================================================================

/**
 * Teacher Application with protected routes
 */
const TeacherApplication: React.FC = () => {
  return (
    <TeacherGuard>
      <TeacherTab.Navigator>
        <TeacherTab.Screen name="Dashboard" component={TeacherDashboard} />
        <TeacherTab.Screen name="Groups" component={TeacherGroups} />
        <TeacherTab.Screen name="Attendance" component={TeacherAttendance} />
        <TeacherTab.Screen name="Schedule" component={TeacherSchedule} />
        <TeacherTab.Screen name="Analytics" component={TeacherAnalytics} />
      </TeacherTab.Navigator>
    </TeacherGuard>
  );
};

/**
 * Example Teacher Dashboard
 */
const TeacherDashboard: React.FC = () => {
  const { updateActivity } = useAuth();
  const { teacherProfile } = useUserProfile();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Welcome, {teacherProfile?.name}!
      </Text>
      
      <Text style={{ fontSize: 16, marginTop: 8 }}>
        Specializations: {teacherProfile?.specializations.join(', ')}
      </Text>
      
      <Text style={{ fontSize: 16 }}>
        Teaching {teacherProfile?.groupIds.length} groups
      </Text>
      
      <Text style={{ fontSize: 16 }}>
        Level: {teacherProfile?.level}
      </Text>

      {/* Trusted Device Guard Example */}
      <TrustedDeviceGuard
        fallback={
          <Text style={{ marginTop: 16, color: 'orange' }}>
            Device trust required for administrative features
          </Text>
        }
      >
        <TouchableOpacity style={{ marginTop: 16, padding: 12, backgroundColor: 'blue' }}>
          <Text style={{ color: 'white' }}>Access Admin Features</Text>
        </TouchableOpacity>
      </TrustedDeviceGuard>
    </View>
  );
};

// =============================================================================
// 8. SECURITY MONITORING EXAMPLE
// =============================================================================

/**
 * Security Monitor Component - can be used anywhere in the app
 */
const SecurityMonitor: React.FC = () => {
  const { securityEvents, securityLevel, hasSecurityConcerns } = useSecurityMonitoring();

  if (!hasSecurityConcerns) {
    return null;
  }

  return (
    <View style={{
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      padding: 12,
      backgroundColor: securityLevel === 'high' ? '#fee2e2' : '#fef3c7',
      borderRadius: 8,
      zIndex: 1000,
    }}>
      <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>
        Security Alert
      </Text>
      <Text style={{ fontSize: 14, color: '#dc2626' }}>
        {securityEvents.length} security events detected
      </Text>
    </View>
  );
};

// =============================================================================
// 9. CUSTOM AUTHENTICATION HOOKS EXAMPLES
// =============================================================================

/**
 * Example custom hook for authentication-aware API calls
 */
const useAuthenticatedAPI = () => {
  const { session, updateActivity } = useAuth();

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // Update activity on API usage
    updateActivity();

    // Add authentication headers
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session?.accessToken}`,
      'Content-Type': 'application/json',
    };

    return fetch(endpoint, { ...options, headers });
  }, [session, updateActivity]);

  return { apiCall };
};

/**
 * Example usage of authentication forms in custom components
 */
const CustomSignInForm: React.FC = () => {
  const {
    credentials,
    updateCredentials,
    handleSignIn,
    isLoading,
    error,
    canUseBiometric,
    handleBiometricSignIn,
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

      <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
        <Text>Sign In</Text>
      </TouchableOpacity>

      {canUseBiometric && (
        <TouchableOpacity onPress={() => handleBiometricSignIn()}>
          <Text>Use Biometric</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
};

// =============================================================================
// 10. OFFLINE AUTHENTICATION EXAMPLE
// =============================================================================

/**
 * Offline Mode Indicator
 */
const OfflineModeIndicator: React.FC = () => {
  const { isOffline, offlineCapability } = useOfflineAuth();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={{
      backgroundColor: '#374151',
      padding: 8,
      alignItems: 'center',
    }}>
      <Text style={{ color: 'white', fontSize: 12 }}>
        📱 Offline Mode - Limited functionality available
      </Text>
    </View>
  );
};

// =============================================================================
// PLACEHOLDER COMPONENTS
// =============================================================================

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
    <Text style={{ marginTop: 16 }}>Loading...</Text>
  </View>
);

const UnsupportedRoleScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, textAlign: 'center' }}>
      Your account role is not supported in this mobile app.
    </Text>
  </View>
);

const ForgotPasswordScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Forgot Password Screen</Text>
  </View>
);

// Placeholder screens for tabs
const StudentHomeTasks = () => <View><Text>Home Tasks</Text></View>;
const StudentVocabulary = () => <View><Text>Vocabulary</Text></View>;
const StudentSchedule = () => <View><Text>Schedule</Text></View>;
const StudentRanking = () => <View><Text>Ranking</Text></View>;

const TeacherGroups = () => <View><Text>Groups</Text></View>;
const TeacherAttendance = () => <View><Text>Attendance</Text></View>;
const TeacherSchedule = () => <View><Text>Schedule</Text></View>;
const TeacherAnalytics = () => <View><Text>Analytics</Text></View>;

export default App;