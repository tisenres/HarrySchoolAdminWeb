/**
 * Age-Appropriate Authentication Flow Component
 * Harry School Educational Mobile Apps
 * 
 * Implements differentiated authentication experiences based on user age
 * with full COPPA/GDPR compliance and educational context awareness
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { COPPABiometricManager, StudentAgeGroup } from '../../services/coppa-compliant-biometric';
import { EducationalDeviceTrust } from '../../services/educational-device-trust';
import { Button, Input, Card, Avatar, Modal } from '../ui';
import { useTheme, useHaptics, useAccessibility } from '../../hooks';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  ageGroup: StudentAgeGroup;
  avatarUrl?: string;
  parentEmail?: string;
  languagePreference: 'en' | 'ru' | 'uz';
  specialNeeds?: string[];
}

export interface AuthFlowProps {
  onAuthSuccess: (user: StudentProfile, sessionInfo: any) => void;
  onAuthError: (error: string) => void;
  organizationId: string;
  deviceTrust: EducationalDeviceTrust;
  initialUser?: StudentProfile;
}

export interface AuthState {
  currentStep: 'user_selection' | 'age_verification' | 'consent_check' | 
                'credential_input' | 'biometric_prompt' | 'pin_input' | 
                'parental_approval' | 'success' | 'error';
  selectedUser: StudentProfile | null;
  authMethod: 'password' | 'biometric' | 'pin' | 'supervised';
  loading: boolean;
  error: string | null;
  consentRequired: boolean;
  parentalApprovalPending: boolean;
}

/**
 * Age-Appropriate Authentication Flow
 * Dynamically adjusts UI and security based on user age and context
 */
export const AgeAppropriateAuthFlow: React.FC<AuthFlowProps> = ({
  onAuthSuccess,
  onAuthError,
  organizationId,
  deviceTrust,
  initialUser,
}) => {
  const { theme, colors } = useTheme();
  const { hapticFeedback } = useHaptics();
  const { announceForAccessibility } = useAccessibility();

  const [authState, setAuthState] = useState<AuthState>({
    currentStep: initialUser ? 'age_verification' : 'user_selection',
    selectedUser: initialUser || null,
    authMethod: 'password',
    loading: false,
    error: null,
    consentRequired: false,
    parentalApprovalPending: false,
  });

  const [credentials, setCredentials] = useState({ email: '', password: '', pin: '' });
  const [slideAnimation] = useState(new Animated.Value(0));

  // Initialize component
  useEffect(() => {
    initializeAuthFlow();
  }, []);

  // Animate between steps
  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: getStepIndex(authState.currentStep),
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [authState.currentStep]);

  /**
   * Initialize authentication flow with device context
   */
  const initializeAuthFlow = async (): Promise<void> => {
    try {
      // Check device trust and policies
      await deviceTrust.initializeDeviceTrust();
      
      // If specific user provided, start age verification
      if (initialUser) {
        setAuthState(prev => ({ ...prev, selectedUser: initialUser }));
        await performAgeVerification(initialUser);
      }
    } catch (error) {
      console.error('Auth flow initialization failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize authentication',
        currentStep: 'error'
      }));
    }
  };

  /**
   * Age verification and appropriate auth method determination
   */
  const performAgeVerification = async (user: StudentProfile): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      // Initialize biometric manager for this user
      const biometricConfig = await COPPABiometricManager.initializeBiometricAuth(
        user.id,
        user.dateOfBirth,
        user.parentEmail
      );

      // Determine authentication flow based on age and device context
      const authFlow = determineAuthenticationFlow(user, biometricConfig);
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        authMethod: authFlow.method,
        consentRequired: authFlow.requiresConsent,
        parentalApprovalPending: authFlow.requiresParentalApproval,
        currentStep: authFlow.nextStep,
      }));

      // Announce step change for accessibility
      announceForAccessibility(getStepAnnouncement(authFlow.nextStep, user.ageGroup));

    } catch (error) {
      console.error('Age verification failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: getAgeAppropriateError(user.ageGroup, error.message),
        currentStep: 'error',
      }));
    }
  };

  /**
   * Determine authentication flow based on user age and context
   */
  const determineAuthenticationFlow = (
    user: StudentProfile, 
    biometricConfig: any
  ): {
    method: AuthState['authMethod'];
    requiresConsent: boolean;
    requiresParentalApproval: boolean;
    nextStep: AuthState['currentStep'];
  } => {
    switch (user.ageGroup) {
      case 'under_13':
        return {
          method: biometricConfig.enabled ? 'biometric' : 'supervised',
          requiresConsent: true,
          requiresParentalApproval: !biometricConfig.parentalConsent,
          nextStep: biometricConfig.parentalConsent ? 'biometric_prompt' : 'parental_approval',
        };

      case '13_to_15':
        return {
          method: biometricConfig.enabled ? 'biometric' : 'password',
          requiresConsent: false,
          requiresParentalApproval: false,
          nextStep: biometricConfig.enabled ? 'biometric_prompt' : 'credential_input',
        };

      case '16_to_18':
        // Check if device supports PIN (teacher-style quick auth)
        const deviceSupportsPin = true; // Would check device capabilities
        return {
          method: biometricConfig.enabled ? 'biometric' : (deviceSupportsPin ? 'pin' : 'password'),
          requiresConsent: false,
          requiresParentalApproval: false,
          nextStep: biometricConfig.enabled ? 'biometric_prompt' : 
                   (deviceSupportsPin ? 'pin_input' : 'credential_input'),
        };

      case 'adult':
        return {
          method: biometricConfig.enabled ? 'biometric' : 'password',
          requiresConsent: false,
          requiresParentalApproval: false,
          nextStep: biometricConfig.enabled ? 'biometric_prompt' : 'credential_input',
        };

      default:
        return {
          method: 'password',
          requiresConsent: false,
          requiresParentalApproval: false,
          nextStep: 'credential_input',
        };
    }
  };

  /**
   * Handle biometric authentication
   */
  const handleBiometricAuth = async (): Promise<void> => {
    if (!authState.selectedUser) return;

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    hapticFeedback('light');

    try {
      const result = await COPPABiometricManager.authenticateWithBiometric(
        authState.selectedUser.id,
        getBiometricPrompt(authState.selectedUser.ageGroup)
      );

      if (result.success) {
        // Create user session
        const session = await deviceTrust.createUserSession(
          authState.selectedUser.id,
          'student',
          'individual',
          'biometric'
        );

        hapticFeedback('success');
        setAuthState(prev => ({ ...prev, loading: false, currentStep: 'success' }));
        onAuthSuccess(authState.selectedUser, session);

      } else if (result.fallbackRequired) {
        // Switch to fallback authentication
        setAuthState(prev => ({
          ...prev,
          loading: false,
          authMethod: authState.selectedUser!.ageGroup === '16_to_18' ? 'pin' : 'password',
          currentStep: authState.selectedUser!.ageGroup === '16_to_18' ? 'pin_input' : 'credential_input',
        }));

      } else {
        throw new Error(result.error || 'Biometric authentication failed');
      }

    } catch (error) {
      console.error('Biometric authentication failed:', error);
      hapticFeedback('error');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: getAgeAppropriateError(authState.selectedUser!.ageGroup, error.message),
        currentStep: 'error',
      }));
    }
  };

  /**
   * Handle password authentication
   */
  const handlePasswordAuth = async (): Promise<void> => {
    if (!authState.selectedUser || !credentials.email || !credentials.password) {
      setAuthState(prev => ({ 
        ...prev, 
        error: getAgeAppropriateError(authState.selectedUser?.ageGroup || 'adult', 'Please fill in all fields') 
      }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    hapticFeedback('light');

    try {
      // Here would integrate with actual auth service
      // For demo, simulate authentication
      await simulateAuthentication(credentials.email, credentials.password);

      // Create user session
      const session = await deviceTrust.createUserSession(
        authState.selectedUser.id,
        'student',
        'individual',
        'password'
      );

      hapticFeedback('success');
      setAuthState(prev => ({ ...prev, loading: false, currentStep: 'success' }));
      onAuthSuccess(authState.selectedUser, session);

    } catch (error) {
      console.error('Password authentication failed:', error);
      hapticFeedback('error');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: getAgeAppropriateError(authState.selectedUser.ageGroup, error.message),
      }));
    }
  };

  /**
   * Handle PIN authentication (for older students)
   */
  const handlePinAuth = async (): Promise<void> => {
    if (!authState.selectedUser || !credentials.pin || credentials.pin.length < 4) {
      setAuthState(prev => ({ 
        ...prev, 
        error: getAgeAppropriateError(authState.selectedUser?.ageGroup || '16_to_18', 'Please enter your PIN') 
      }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    hapticFeedback('light');

    try {
      // Validate PIN (would integrate with actual auth service)
      await simulatePinAuthentication(authState.selectedUser.id, credentials.pin);

      // Create user session
      const session = await deviceTrust.createUserSession(
        authState.selectedUser.id,
        'student',
        'individual',
        'pin'
      );

      hapticFeedback('success');
      setAuthState(prev => ({ ...prev, loading: false, currentStep: 'success' }));
      onAuthSuccess(authState.selectedUser, session);

    } catch (error) {
      console.error('PIN authentication failed:', error);
      hapticFeedback('error');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: getAgeAppropriateError(authState.selectedUser.ageGroup, error.message),
      }));
    }
  };

  /**
   * Get age-appropriate error message
   */
  const getAgeAppropriateError = (ageGroup: StudentAgeGroup, originalError: string): string => {
    const errorMappings = {
      under_13: {
        'Invalid credentials': 'Oops! That doesn\'t look right. Ask your teacher for help!',
        'Network error': 'Having trouble connecting. Let\'s try again!',
        'Biometric failed': 'Your fingerprint didn\'t work. Let\'s try typing your password instead!',
        'default': 'Something went wrong. Please ask your teacher for help!'
      },
      '13_to_15': {
        'Invalid credentials': 'Incorrect email or password. Please try again.',
        'Network error': 'Connection problem. Check your internet and try again.',
        'Biometric failed': 'Fingerprint authentication failed. Try your password instead.',
        'default': 'Authentication failed. Please try again or contact support.'
      },
      '16_to_18': {
        'Invalid credentials': 'Invalid login credentials. Please verify and try again.',
        'Network error': 'Network connection error. Please check your connection.',
        'Biometric failed': 'Biometric authentication failed. Use PIN or password instead.',
        'default': 'Login failed. Please try again or contact support.'
      },
      adult: {
        'Invalid credentials': 'Invalid email or password. Please check your credentials.',
        'Network error': 'Network connectivity issue. Please check your connection.',
        'Biometric failed': 'Biometric authentication unsuccessful. Please use alternative method.',
        'default': 'Authentication error. Please try again or contact support.'
      }
    };

    const ageErrors = errorMappings[ageGroup];
    return ageErrors[originalError as keyof typeof ageErrors] || ageErrors.default;
  };

  /**
   * Get biometric prompt based on age
   */
  const getBiometricPrompt = (ageGroup: StudentAgeGroup): string => {
    switch (ageGroup) {
      case 'under_13':
        return 'With your parent\'s permission, place your finger on the sensor to sign in';
      case '13_to_15':
        return 'Use your fingerprint to sign in to Harry School';
      case '16_to_18':
        return 'Authenticate with fingerprint or face to continue';
      case 'adult':
        return 'Use biometric authentication to sign in';
      default:
        return 'Authenticate to continue';
    }
  };

  /**
   * Get step announcement for accessibility
   */
  const getStepAnnouncement = (step: AuthState['currentStep'], ageGroup: StudentAgeGroup): string => {
    const announcements = {
      user_selection: 'Select your profile to sign in',
      age_verification: 'Verifying age-appropriate authentication',
      consent_check: 'Checking parental consent',
      credential_input: ageGroup === 'under_13' ? 'Enter your login with parent supervision' : 'Enter your credentials',
      biometric_prompt: 'Biometric authentication ready',
      pin_input: 'Enter your PIN',
      parental_approval: 'Waiting for parental approval',
      success: 'Sign in successful',
      error: 'Sign in failed',
    };

    return announcements[step] || 'Authentication step changed';
  };

  /**
   * Get step index for animation
   */
  const getStepIndex = (step: AuthState['currentStep']): number => {
    const steps = [
      'user_selection', 'age_verification', 'consent_check', 
      'credential_input', 'biometric_prompt', 'pin_input', 
      'parental_approval', 'success', 'error'
    ];
    return steps.indexOf(step);
  };

  /**
   * Simulate authentication (replace with actual implementation)
   */
  const simulateAuthentication = async (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1500);
    });
  };

  /**
   * Simulate PIN authentication (replace with actual implementation)
   */
  const simulatePinAuthentication = async (userId: string, pin: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (pin.length >= 4) {
          resolve();
        } else {
          reject(new Error('Invalid PIN'));
        }
      }, 1000);
    });
  };

  /**
   * Render age-appropriate UI
   */
  const renderAuthStep = (): React.ReactNode => {
    switch (authState.currentStep) {
      case 'credential_input':
        return renderCredentialInput();
      case 'biometric_prompt':
        return renderBiometricPrompt();
      case 'pin_input':
        return renderPinInput();
      case 'parental_approval':
        return renderParentalApproval();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderCredentialInput();
    }
  };

  const renderCredentialInput = (): React.ReactNode => (
    <Card style={[styles.authCard, getAgeAppropriateCardStyle(authState.selectedUser?.ageGroup)]}>
      <View style={styles.cardHeader}>
        {authState.selectedUser && (
          <Avatar
            source={{ uri: authState.selectedUser.avatarUrl }}
            name={authState.selectedUser.name}
            size={getAvatarSize(authState.selectedUser.ageGroup)}
          />
        )}
        <Text style={[styles.welcomeText, getAgeAppropriateTextStyle(authState.selectedUser?.ageGroup)]}>
          {getWelcomeMessage(authState.selectedUser?.ageGroup)}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="Email"
          value={credentials.email}
          onChangeText={(email) => setCredentials(prev => ({ ...prev, email }))}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Enter your email address"
          disabled={authState.loading}
          style={getAgeAppropriateInputStyle(authState.selectedUser?.ageGroup)}
        />

        <Input
          label="Password"
          value={credentials.password}
          onChangeText={(password) => setCredentials(prev => ({ ...prev, password }))}
          secureTextEntry
          textContentType="password"
          accessibilityLabel="Enter your password"
          disabled={authState.loading}
          style={getAgeAppropriateInputStyle(authState.selectedUser?.ageGroup)}
        />
      </View>

      {authState.error && (
        <Text style={[styles.errorText, getAgeAppropriateErrorStyle(authState.selectedUser?.ageGroup)]}>
          {authState.error}
        </Text>
      )}

      <Button
        title={getSignInButtonText(authState.selectedUser?.ageGroup)}
        onPress={handlePasswordAuth}
        loading={authState.loading}
        style={getAgeAppropriateButtonStyle(authState.selectedUser?.ageGroup)}
        accessibilityLabel="Sign in with email and password"
      />
    </Card>
  );

  const renderBiometricPrompt = (): React.ReactNode => (
    <Card style={[styles.authCard, styles.biometricCard]}>
      <View style={styles.biometricContainer}>
        <MaterialIcons 
          name="fingerprint" 
          size={80} 
          color={colors.primary}
          style={styles.biometricIcon}
        />
        <Text style={styles.biometricTitle}>
          {getBiometricTitle(authState.selectedUser?.ageGroup)}
        </Text>
        <Text style={styles.biometricDescription}>
          {getBiometricPrompt(authState.selectedUser?.ageGroup || 'adult')}
        </Text>

        <Button
          title="Use Fingerprint"
          onPress={handleBiometricAuth}
          loading={authState.loading}
          style={styles.biometricButton}
          icon="fingerprint"
        />

        <Button
          title="Use Password Instead"
          onPress={() => setAuthState(prev => ({ ...prev, currentStep: 'credential_input' }))}
          variant="outline"
          style={styles.fallbackButton}
        />
      </View>
    </Card>
  );

  const renderPinInput = (): React.ReactNode => (
    <Card style={[styles.authCard, styles.pinCard]}>
      <View style={styles.pinContainer}>
        <FontAwesome5 
          name="lock" 
          size={60} 
          color={colors.primary}
          style={styles.pinIcon}
        />
        <Text style={styles.pinTitle}>Enter Your PIN</Text>
        <Text style={styles.pinDescription}>
          Enter your 4-6 digit PIN to quickly access your account
        </Text>

        <Input
          value={credentials.pin}
          onChangeText={(pin) => setCredentials(prev => ({ ...prev, pin }))}
          secureTextEntry
          keyboardType="numeric"
          maxLength={6}
          placeholder="••••"
          style={styles.pinInput}
          textAlign="center"
          accessibilityLabel="Enter your PIN"
        />

        <Button
          title="Sign In"
          onPress={handlePinAuth}
          loading={authState.loading}
          style={styles.pinButton}
        />

        <Button
          title="Use Password Instead"
          onPress={() => setAuthState(prev => ({ ...prev, currentStep: 'credential_input' }))}
          variant="text"
        />
      </View>
    </Card>
  );

  const renderParentalApproval = (): React.ReactNode => (
    <Card style={styles.authCard}>
      <View style={styles.approvalContainer}>
        <MaterialIcons name="supervisor-account" size={80} color={colors.warning} />
        <Text style={styles.approvalTitle}>Parental Approval Required</Text>
        <Text style={styles.approvalDescription}>
          We've sent an approval request to your parent's email. 
          Please ask them to check their email and approve your biometric authentication.
        </Text>
        
        <Button
          title="I'll Wait for Approval"
          onPress={() => setAuthState(prev => ({ ...prev, currentStep: 'credential_input' }))}
          variant="outline"
        />
      </View>
    </Card>
  );

  const renderSuccess = (): React.ReactNode => (
    <Card style={styles.authCard}>
      <View style={styles.successContainer}>
        <MaterialIcons name="check-circle" size={80} color={colors.success} />
        <Text style={styles.successTitle}>Welcome Back!</Text>
        <Text style={styles.successDescription}>
          {getSuccessMessage(authState.selectedUser?.ageGroup)}
        </Text>
      </View>
    </Card>
  );

  const renderError = (): React.ReactNode => (
    <Card style={styles.authCard}>
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={80} color={colors.error} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorDescription}>{authState.error}</Text>
        
        <Button
          title="Try Again"
          onPress={() => setAuthState(prev => ({ 
            ...prev, 
            currentStep: 'credential_input',
            error: null 
          }))}
        />
      </View>
    </Card>
  );

  // Age-appropriate styling helpers
  const getAgeAppropriateCardStyle = (ageGroup?: StudentAgeGroup) => {
    switch (ageGroup) {
      case 'under_13':
        return { backgroundColor: colors.surface, borderRadius: 20 };
      case '13_to_15':
        return { backgroundColor: colors.surface, borderRadius: 16 };
      default:
        return { backgroundColor: colors.surface, borderRadius: 12 };
    }
  };

  const getAgeAppropriateTextStyle = (ageGroup?: StudentAgeGroup) => {
    switch (ageGroup) {
      case 'under_13':
        return { fontSize: 18, fontWeight: '600' as const, color: colors.primary };
      case '13_to_15':
        return { fontSize: 16, fontWeight: '500' as const, color: colors.text };
      default:
        return { fontSize: 16, fontWeight: '500' as const, color: colors.text };
    }
  };

  const getAvatarSize = (ageGroup?: StudentAgeGroup): number => {
    switch (ageGroup) {
      case 'under_13': return 80;
      case '13_to_15': return 70;
      default: return 60;
    }
  };

  const getWelcomeMessage = (ageGroup?: StudentAgeGroup): string => {
    switch (ageGroup) {
      case 'under_13': return 'Hi there! Let\'s learn together! 🌟';
      case '13_to_15': return 'Welcome back to Harry School!';
      case '16_to_18': return 'Ready to continue learning?';
      case 'adult': return 'Welcome to Harry School';
      default: return 'Sign in to continue';
    }
  };

  const getBiometricTitle = (ageGroup?: StudentAgeGroup): string => {
    switch (ageGroup) {
      case 'under_13': return 'Magic Fingerprint! ✨';
      case '13_to_15': return 'Quick Sign In';
      default: return 'Biometric Authentication';
    }
  };

  const getSignInButtonText = (ageGroup?: StudentAgeGroup): string => {
    switch (ageGroup) {
      case 'under_13': return 'Let\'s Go! 🚀';
      case '13_to_15': return 'Sign In';
      default: return 'Sign In';
    }
  };

  const getSuccessMessage = (ageGroup?: StudentAgeGroup): string => {
    switch (ageGroup) {
      case 'under_13': return 'Great job! Ready to learn something awesome today? 🎉';
      case '13_to_15': return 'You\'re all set! Let\'s continue your learning journey.';
      default: return 'Authentication successful. Welcome to your learning dashboard.';
    }
  };

  // Additional styling helper functions would be implemented here...
  const getAgeAppropriateInputStyle = (ageGroup?: StudentAgeGroup) => ({});
  const getAgeAppropriateButtonStyle = (ageGroup?: StudentAgeGroup) => ({});
  const getAgeAppropriateErrorStyle = (ageGroup?: StudentAgeGroup) => ({});

  return (
    <LinearGradient
      colors={getAgeAppropriateGradient(authState.selectedUser?.ageGroup)}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 8],
                outputRange: [0, -Dimensions.get('window').width * 8],
              }),
            }],
          },
        ]}
      >
        {renderAuthStep()}
      </Animated.View>
    </LinearGradient>
  );
};

const getAgeAppropriateGradient = (ageGroup?: StudentAgeGroup): string[] => {
  switch (ageGroup) {
    case 'under_13':
      return ['#E3F2FD', '#BBDEFB', '#90CAF9']; // Light blue gradient
    case '13_to_15':
      return ['#F3E5F5', '#E1BEE7', '#CE93D8']; // Light purple gradient
    case '16_to_18':
      return ['#E8F5E8', '#C8E6C9', '#A5D6A7']; // Light green gradient
    case 'adult':
      return ['#FAFAFA', '#F5F5F5', '#EEEEEE']; // Neutral gradient
    default:
      return ['#FFFFFF', '#F8F9FA', '#E9ECEF']; // Default gradient
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width * 9,
  },
  authCard: {
    width: Dimensions.get('window').width - 40,
    marginHorizontal: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    marginTop: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    gap: 16,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  biometricCard: {
    alignItems: 'center',
  },
  biometricContainer: {
    alignItems: 'center',
  },
  biometricIcon: {
    marginBottom: 16,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  biometricDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  biometricButton: {
    marginBottom: 12,
    minWidth: 200,
  },
  fallbackButton: {
    minWidth: 200,
  },
  pinCard: {
    alignItems: 'center',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinIcon: {
    marginBottom: 16,
  },
  pinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pinDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  pinInput: {
    fontSize: 24,
    letterSpacing: 8,
    marginBottom: 24,
    minWidth: 120,
  },
  pinButton: {
    marginBottom: 16,
    minWidth: 200,
  },
  approvalContainer: {
    alignItems: 'center',
  },
  approvalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  approvalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#4CAF50',
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#F44336',
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
});

export default AgeAppropriateAuthFlow;