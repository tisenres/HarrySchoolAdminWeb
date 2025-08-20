/**
 * Root Navigator for Harry School Student App
 * 
 * Manages the top-level navigation structure with authentication state management.
 * Implements proper loading states, error boundaries, and deep linking support.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus 
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

// Shared components and context
import { useAuth, AuthProvider } from '@harry-school/shared';
import { theme } from '@harry-school/ui';

// Navigation components
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

// Types
import type { RootStackParamList, NavigationAnalytics, DeepLinkParams } from './types';

// Analytics and tracking
import { navigationAnalytics } from '../services/navigation-analytics';
import { progressPreservation } from '../services/progress-preservation';

const Stack = createNativeStackNavigator<RootStackParamList>();

// =====================================================
// NAVIGATION THEME CONFIGURATION
// =====================================================

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary[600], // #1d7452
    background: theme.colors.neutral[50],
    card: theme.colors.white,
    text: theme.colors.neutral[900],
    border: theme.colors.neutral[200],
    notification: theme.colors.accent.orange,
  },
};

// =====================================================
// DEEP LINKING CONFIGURATION
// =====================================================

const linking = {
  prefixes: ['harryschool://student', 'https://student.harryschool.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          SignIn: 'signin',
          ForgotPassword: 'forgot-password',
          BiometricLogin: 'biometric-login',
          PinLogin: 'pin-login',
          OnboardingStart: 'onboarding/start',
          OnboardingPersonalization: 'onboarding/personalization',
          OnboardingGoals: 'onboarding/goals',
          OnboardingComplete: 'onboarding/complete',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              HomeDashboard: 'home',
              RankingLeaderboard: 'home/ranking/:period?',
              AchievementDetails: 'home/achievement/:achievementId',
              DailyGoals: 'home/goals',
              AnnouncementDetails: 'home/announcement/:announcementId',
            },
          },
          LessonsTab: {
            screens: {
              LessonsOverview: 'lessons',
              LessonContent: 'lessons/:lessonId/:moduleId',
              InteractiveLearning: 'lessons/:lessonId/activity/:activityType/:activityId',
              HomeworkTasks: 'lessons/homework',
              AIGeneratedTasks: 'lessons/ai-tasks',
              TaskSubmission: 'lessons/task/:taskId/submit',
              ExtraLearning: 'lessons/extra',
            },
          },
          ScheduleTab: {
            screens: {
              ScheduleOverview: 'schedule',
              DailySchedule: 'schedule/daily/:date?',
              WeeklySchedule: 'schedule/weekly/:week?',
              ClassDetails: 'schedule/class/:classId/:date',
              UpcomingAssignments: 'schedule/assignments',
            },
          },
          VocabularyTab: {
            screens: {
              VocabularyDashboard: 'vocabulary',
              FlashcardSession: 'vocabulary/flashcards/:setId?',
              VocabularyTranslator: 'vocabulary/translator',
              WordDetails: 'vocabulary/word/:wordId',
              VocabularyQuiz: 'vocabulary/quiz/:quizType',
            },
          },
          ProfileTab: {
            screens: {
              ProfileOverview: 'profile',
              EditProfile: 'profile/edit',
              ProgressTracking: 'profile/progress',
              ReferralProgram: 'profile/referral',
              AccountSettings: 'profile/settings',
            },
          },
        },
      },
      // Modal screens
      StudentProfile: 'student/:studentId',
      TeacherProfile: 'teacher/:teacherId',
      LessonDetails: 'lesson/:lessonId',
      AssignmentDetails: 'assignment/:assignmentId',
      VocabularyTest: 'vocabulary/test',
      RewardsShop: 'rewards',
      Notifications: 'notifications',
      Settings: 'settings',
      HelpSupport: 'help',
      LanguageSelector: 'language',
    },
  },
};

// =====================================================
// LOADING SCREEN COMPONENT
// =====================================================

const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary[600]} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// =====================================================
// ERROR SCREEN COMPONENT
// =====================================================

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

// =====================================================
// MAIN ROOT NAVIGATOR COMPONENT
// =====================================================

interface RootNavigatorContentProps {
  onReady?: () => void;
}

const RootNavigatorContent: React.FC<RootNavigatorContentProps> = ({ onReady }) => {
  const { 
    isAuthenticated, 
    isInitializing, 
    hasCheckedStoredAuth,
    needsReauth,
    error,
    clearError,
    retryAuth,
    isStudent,
    updateActivity 
  } = useAuth();

  const routeNameRef = useRef<string>();
  const navigationRef = useRef<any>();
  const appState = useRef(AppState.currentState);

  // =====================================================
  // APP STATE MONITORING
  // =====================================================

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - update activity
        if (isAuthenticated) {
          updateActivity();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, updateActivity]);

  // =====================================================
  // NAVIGATION STATE TRACKING
  // =====================================================

  const onNavigationReady = useCallback(() => {
    // Initialize navigation analytics
    const initialRoute = navigationRef.current?.getCurrentRoute();
    if (initialRoute) {
      routeNameRef.current = initialRoute.name;
      navigationAnalytics.trackScreenView(initialRoute.name, initialRoute.params);
    }
    
    // Restore any preserved progress
    progressPreservation.restoreProgress();
    
    onReady?.();
  }, [onReady]);

  const onNavigationStateChange = useCallback(async () => {
    const previousRouteName = routeNameRef.current;
    const currentRoute = navigationRef.current?.getCurrentRoute();
    
    if (currentRoute && previousRouteName !== currentRoute.name) {
      // Track navigation analytics
      navigationAnalytics.trackScreenView(currentRoute.name, currentRoute.params);
      
      // Preserve progress from previous screen
      if (previousRouteName) {
        await progressPreservation.preserveProgress(previousRouteName);
      }
      
      // Update activity timestamp
      if (isAuthenticated) {
        updateActivity();
      }
      
      routeNameRef.current = currentRoute.name;
    }
  }, [isAuthenticated, updateActivity]);

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  const handleRetry = useCallback(async () => {
    clearError();
    try {
      await retryAuth();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }, [clearError, retryAuth]);

  // =====================================================
  // DEEP LINK HANDLING
  // =====================================================

  const handleDeepLink = useCallback((url: string) => {
    // Ensure user is authenticated before handling deep links to protected content
    if (!isAuthenticated && !url.includes('/auth/')) {
      // Store the deep link for after authentication
      // This will be handled by the auth flow
      return;
    }

    // Additional security checks for student role
    if (isAuthenticated && !isStudent()) {
      Alert.alert(
        'Access Denied',
        'This link is only available for students.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Track deep link usage
    navigationAnalytics.trackDeepLink(url);
  }, [isAuthenticated, isStudent]);

  // =====================================================
  // RENDER LOGIC
  // =====================================================

  // Show loading screen during initialization
  if (isInitializing || !hasCheckedStoredAuth) {
    return <LoadingScreen message="Initializing app..." />;
  }

  // Show error screen for critical errors
  if (error && error !== 'REAUTH_REQUIRED' && error !== 'SESSION_EXPIRED') {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // Show reauth screen for session issues
  if (needsReauth && isAuthenticated) {
    return (
      <View style={styles.reauthContainer}>
        <Text style={styles.reauthTitle}>Session Expired</Text>
        <Text style={styles.reauthMessage}>
          Please verify your identity to continue using the app.
        </Text>
        <TouchableOpacity style={styles.reauthButton} onPress={handleRetry}>
          <Text style={styles.reauthButtonText}>Verify Identity</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={NavigationTheme}
      linking={linking}
      onReady={onNavigationReady}
      onStateChange={onNavigationStateChange}
      fallback={<LoadingScreen message="Loading navigation..." />}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          // Accessibility optimizations
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.neutral[900],
          },
          headerStyle: {
            backgroundColor: theme.colors.white,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        {!isAuthenticated ? (
          // Authentication flow
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{
              animationTypeForReplace: 'pop',
            }}
          />
        ) : (
          // Main app flow
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator}
              options={{
                animationTypeForReplace: 'push',
              }}
            />
            
            {/* Modal screens that overlay the main navigation */}
            <Stack.Group 
              screenOptions={{ 
                presentation: 'modal',
                gestureEnabled: true,
                headerShown: true,
                headerStyle: {
                  backgroundColor: theme.colors.white,
                },
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.colors.neutral[900],
                },
              }}
            >
              <Stack.Screen 
                name="StudentProfile" 
                component={StudentProfileScreen}
                options={({ route }) => ({
                  title: 'Student Profile',
                  headerBackTitle: 'Back',
                })}
              />
              <Stack.Screen 
                name="TeacherProfile" 
                component={TeacherProfileScreen}
                options={{
                  title: 'Teacher Profile',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="LessonDetails" 
                component={LessonDetailsScreen}
                options={{
                  title: 'Lesson Details',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="AssignmentDetails" 
                component={AssignmentDetailsScreen}
                options={{
                  title: 'Assignment',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="VocabularyTest" 
                component={VocabularyTestScreen}
                options={{
                  title: 'Vocabulary Test',
                  headerBackTitle: 'Back',
                  gestureEnabled: false, // Prevent accidental exits during tests
                }}
              />
              <Stack.Screen 
                name="RewardsShop" 
                component={RewardsShopScreen}
                options={{
                  title: 'Rewards Shop',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{
                  title: 'Notifications',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{
                  title: 'Settings',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="HelpSupport" 
                component={HelpSupportScreen}
                options={{
                  title: 'Help & Support',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="LanguageSelector" 
                component={LanguageSelectorScreen}
                options={{
                  title: 'Language',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="BiometricSetup" 
                component={BiometricSetupScreen}
                options={{
                  title: 'Biometric Setup',
                  headerBackTitle: 'Back',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen 
                name="PinSetup" 
                component={PinSetupScreen}
                options={{
                  title: 'PIN Setup',
                  headerBackTitle: 'Back',
                  gestureEnabled: false,
                }}
              />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// =====================================================
// MAIN EXPORTED COMPONENT WITH AUTH PROVIDER
// =====================================================

interface RootNavigatorProps {
  onReady?: () => void;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ onReady }) => {
  return (
    <AuthProvider autoSignIn={true} enableOfflineMode={true}>
      <RootNavigatorContent onReady={onReady} />
    </AuthProvider>
  );
};

// =====================================================
// PLACEHOLDER MODAL SCREEN COMPONENTS
// =====================================================
// These will be implemented in separate files

import { TouchableOpacity } from 'react-native';

const StudentProfileScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Student Profile Screen</Text>
  </View>
);

const TeacherProfileScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Teacher Profile Screen</Text>
  </View>
);

const LessonDetailsScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Lesson Details Screen</Text>
  </View>
);

const AssignmentDetailsScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Assignment Details Screen</Text>
  </View>
);

const VocabularyTestScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Vocabulary Test Screen</Text>
  </View>
);

const RewardsShopScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Rewards Shop Screen</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Notifications Screen</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Settings Screen</Text>
  </View>
);

const HelpSupportScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Help & Support Screen</Text>
  </View>
);

const LanguageSelectorScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Language Selector Screen</Text>
  </View>
);

const BiometricSetupScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Biometric Setup Screen</Text>
  </View>
);

const PinSetupScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>PIN Setup Screen</Text>
  </View>
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.neutral[600],
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  reauthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  reauthMessage: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  reauthButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  reauthButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  placeholderText: {
    fontSize: 18,
    color: theme.colors.neutral[600],
    fontWeight: '500',
  },
});

export default RootNavigator;