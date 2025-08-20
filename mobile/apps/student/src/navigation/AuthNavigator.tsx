/**
 * Auth Navigator for Harry School Student App
 * 
 * Handles authentication flow including login, biometric setup, and onboarding.
 * Optimized for educational context with age-appropriate UX (10-18 years).
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and hooks
import { useAuth } from '@harry-school/shared';
import { theme } from '@harry-school/ui';

// Auth screens (will be implemented in separate files)
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { BiometricLoginScreen } from '../screens/auth/BiometricLoginScreen';
import { PinLoginScreen } from '../screens/auth/PinLoginScreen';
import { OnboardingStartScreen } from '../screens/auth/OnboardingStartScreen';
import { OnboardingPersonalizationScreen } from '../screens/auth/OnboardingPersonalizationScreen';
import { OnboardingGoalsScreen } from '../screens/auth/OnboardingGoalsScreen';
import { OnboardingCompleteScreen } from '../screens/auth/OnboardingCompleteScreen';

// Types
import type { AuthStackParamList, AuthStackScreenProps } from './types';

// Analytics
import { authAnalytics } from '../services/auth-analytics';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// =====================================================
// SCREEN OPTIONS CONFIGURATION
// =====================================================

const getScreenOptions = (title: string, showHeader: boolean = false) => ({
  headerShown: showHeader,
  title,
  gestureEnabled: true,
  animation: 'slide_from_right' as const,
  headerStyle: {
    backgroundColor: theme.colors.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.neutral[900],
  },
  headerBackTitleVisible: false,
  headerTintColor: theme.colors.primary[600],
});

// =====================================================
// WELCOME SCREEN OPTIONS
// =====================================================

const welcomeScreenOptions = {
  ...getScreenOptions('Welcome'),
  animationTypeForReplace: 'push' as const,
};

// =====================================================
// ONBOARDING SCREEN OPTIONS
// =====================================================

const onboardingScreenOptions = {
  ...getScreenOptions('Setup Your Profile'),
  gestureEnabled: false, // Prevent accidental back navigation during onboarding
};

// =====================================================
// MAIN AUTH NAVIGATOR COMPONENT
// =====================================================

interface AuthNavigatorProps {}

export const AuthNavigator: React.FC<AuthNavigatorProps> = () => {
  const { 
    canUseBiometric, 
    canUsePIN, 
    lastSignInMethod,
    error,
    clearError,
    isStudent 
  } = useAuth();

  // =====================================================
  // ANALYTICS TRACKING
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      // Track when user enters auth flow
      authAnalytics.trackAuthFlowStart();
      
      return () => {
        // Cleanup when leaving auth flow
        clearError();
      };
    }, [clearError])
  );

  // =====================================================
  // INITIAL ROUTE DETERMINATION
  // =====================================================

  const getInitialRouteName = useCallback((): keyof AuthStackParamList => {
    // If user has biometric enabled and it was their last sign-in method
    if (canUseBiometric && lastSignInMethod === 'biometric') {
      return 'BiometricLogin';
    }
    
    // If user has PIN enabled and it was their last sign-in method
    if (canUsePIN && lastSignInMethod === 'pin') {
      return 'PinLogin';
    }
    
    // If there's a specific error state
    if (error === 'REAUTH_REQUIRED' || error === 'SESSION_EXPIRED') {
      // Show the last known sign-in method for re-authentication
      if (lastSignInMethod === 'biometric' && canUseBiometric) {
        return 'BiometricLogin';
      }
      if (lastSignInMethod === 'pin' && canUsePIN) {
        return 'PinLogin';
      }
      return 'SignIn';
    }
    
    // Default to welcome screen for new users
    return 'Welcome';
  }, [canUseBiometric, canUsePIN, lastSignInMethod, error]);

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.white,
        },
      }}
    >
      {/* =====================================================
          MAIN AUTHENTICATION SCREENS
          ===================================================== */}
      
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={welcomeScreenOptions}
      />

      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={getScreenOptions('Sign In')}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          ...getScreenOptions('Reset Password', true),
          headerBackTitle: 'Back',
        }}
      />

      {/* =====================================================
          BIOMETRIC AND PIN AUTHENTICATION
          ===================================================== */}

      <Stack.Screen
        name="BiometricLogin"
        component={BiometricLoginScreen}
        options={{
          ...getScreenOptions('Biometric Login'),
          gestureEnabled: false, // Prevent back gesture during biometric prompt
        }}
      />

      <Stack.Screen
        name="PinLogin"
        component={PinLoginScreen}
        options={{
          ...getScreenOptions('Enter PIN'),
          gestureEnabled: false, // Prevent back gesture during PIN entry
        }}
      />

      {/* =====================================================
          ONBOARDING FLOW FOR NEW STUDENTS
          ===================================================== */}

      <Stack.Group
        screenOptions={{
          ...onboardingScreenOptions,
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.primary[50],
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.primary[800],
          },
          cardStyle: {
            backgroundColor: theme.colors.primary[50],
          },
        }}
      >
        <Stack.Screen
          name="OnboardingStart"
          component={OnboardingStartScreen}
          options={{
            title: 'Welcome to Harry School!',
            headerLeft: () => null, // Remove back button
          }}
        />

        <Stack.Screen
          name="OnboardingPersonalization"
          component={OnboardingPersonalizationScreen}
          options={{
            title: 'Personalize Your Experience',
          }}
        />

        <Stack.Screen
          name="OnboardingGoals"
          component={OnboardingGoalsScreen}
          options={{
            title: 'Set Your Learning Goals',
          }}
        />

        <Stack.Screen
          name="OnboardingComplete"
          component={OnboardingCompleteScreen}
          options={{
            title: 'You\'re All Set!',
            gestureEnabled: false,
            headerLeft: () => null, // Remove back button
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

// =====================================================
// ERROR BOUNDARY FOR AUTH FLOW
// =====================================================

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AuthErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  AuthErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth navigation error:', error, errorInfo);
    authAnalytics.trackAuthError(error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Authentication Error</Text>
          <Text style={styles.errorMessage}>
            Something went wrong with the authentication flow. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// WRAPPED AUTH NAVIGATOR WITH ERROR BOUNDARY
// =====================================================

export const AuthNavigatorWithErrorBoundary: React.FC = () => (
  <AuthErrorBoundary>
    <AuthNavigator />
  </AuthErrorBoundary>
);

// =====================================================
// PLACEHOLDER SCREEN COMPONENTS
// =====================================================
// These will be moved to separate files in the screens/auth directory

const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>{title}</Text>
    <Text style={styles.placeholderSubtitle}>Screen implementation coming soon</Text>
  </View>
);

// Temporary placeholder implementations
const WelcomeScreenPlaceholder = () => <PlaceholderScreen title="Welcome Screen" />;
const SignInScreenPlaceholder = () => <PlaceholderScreen title="Sign In Screen" />;
const ForgotPasswordScreenPlaceholder = () => <PlaceholderScreen title="Forgot Password Screen" />;
const BiometricLoginScreenPlaceholder = () => <PlaceholderScreen title="Biometric Login Screen" />;
const PinLoginScreenPlaceholder = () => <PlaceholderScreen title="PIN Login Screen" />;
const OnboardingStartScreenPlaceholder = () => <PlaceholderScreen title="Onboarding Start Screen" />;
const OnboardingPersonalizationScreenPlaceholder = () => <PlaceholderScreen title="Personalization Screen" />;
const OnboardingGoalsScreenPlaceholder = () => <PlaceholderScreen title="Goals Screen" />;
const OnboardingCompleteScreenPlaceholder = () => <PlaceholderScreen title="Onboarding Complete Screen" />;

// Export placeholders if the actual screen components don't exist
export const WelcomeScreen = WelcomeScreenPlaceholder;
export const SignInScreen = SignInScreenPlaceholder;
export const ForgotPasswordScreen = ForgotPasswordScreenPlaceholder;
export const BiometricLoginScreen = BiometricLoginScreenPlaceholder;
export const PinLoginScreen = PinLoginScreenPlaceholder;
export const OnboardingStartScreen = OnboardingStartScreenPlaceholder;
export const OnboardingPersonalizationScreen = OnboardingPersonalizationScreenPlaceholder;
export const OnboardingGoalsScreen = OnboardingGoalsScreenPlaceholder;
export const OnboardingCompleteScreen = OnboardingCompleteScreenPlaceholder;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.red[600],
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
});

export default AuthNavigator;