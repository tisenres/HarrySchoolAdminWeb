import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Vibration,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { AuthService } from '../api/supabase/services/auth.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type UserRole = 'teacher' | 'student';

interface LoginScreenProps {
  onSuccess: (user: any, role: UserRole) => void;
  onError: (error: string) => void;
  initialRole?: UserRole;
}

interface PINInputProps {
  length: number;
  value: string;
  onComplete: (pin: string) => void;
  isError: boolean;
  onChangeText: (pin: string) => void;
}

const PINInput: React.FC<PINInputProps> = ({
  length,
  value,
  onComplete,
  isError,
  onChangeText,
}) => {
  const theme = useTheme();
  const shakeAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeAnimation.value },
      { scale: scaleAnimation.value },
    ],
  }));

  useEffect(() => {
    if (isError) {
      // Shake animation for error
      shakeAnimation.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [isError]);

  useEffect(() => {
    if (value.length === length) {
      // Success animation
      scaleAnimation.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      runOnJS(onComplete)(value);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [value, length, onComplete]);

  const renderPinCircles = () => {
    const circles = [];
    for (let i = 0; i < length; i++) {
      const isFilled = i < value.length;
      circles.push(
        <Animated.View
          key={i}
          style={[
            styles.pinCircle,
            {
              backgroundColor: isFilled ? theme.tokens.colors.primary[500] : 'transparent',
              borderColor: isError 
                ? theme.tokens.colors.semantic.error 
                : isFilled 
                ? theme.tokens.colors.primary[500] 
                : theme.tokens.colors.neutral[300],
            },
          ]}
        />
      );
    }
    return circles;
  };

  return (
    <Animated.View style={[styles.pinContainer, animatedStyle]}>
      <View style={styles.pinCirclesRow}>
        {renderPinCircles()}
      </View>
    </Animated.View>
  );
};

const NumberPad: React.FC<{
  onNumberPress: (number: string) => void;
  onDeletePress: () => void;
  theme: any;
}> = ({ onNumberPress, onDeletePress, theme }) => {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '⌫'],
  ];

  const handlePress = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value === '⌫') {
      onDeletePress();
    } else if (value !== '*') {
      onNumberPress(value);
    }
  };

  return (
    <View style={styles.numberPad}>
      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.numberRow}>
          {row.map((number) => (
            <TouchableOpacity
              key={number}
              style={[
                styles.numberButton,
                {
                  backgroundColor: number === '*' ? 'transparent' : theme.tokens.colors.neutral[50],
                },
              ]}
              onPress={() => handlePress(number)}
              disabled={number === '*'}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.numberText,
                  {
                    color: number === '⌫' 
                      ? theme.tokens.colors.primary[500] 
                      : theme.tokens.colors.neutral[900],
                    opacity: number === '*' ? 0 : 1,
                  },
                ]}
              >
                {number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onError,
  initialRole = 'teacher',
}) => {
  const theme = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [currentStep, setCurrentStep] = useState<'role' | 'auth'>('role');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'pin' | 'email' | 'biometric'>('pin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const slideAnimation = useSharedValue(0);
  const fadeAnimation = useSharedValue(1);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (isAvailable && isEnrolled) {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricType(supportedTypes[0] || null);
    }
  };

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnimation.value }],
    opacity: fadeAnimation.value,
  }));

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    slideAnimation.value = withTiming(-SCREEN_WIDTH, { duration: 300 });
    
    setTimeout(() => {
      setCurrentStep('auth');
      slideAnimation.value = SCREEN_WIDTH;
      slideAnimation.value = withTiming(0, { duration: 300 });
    }, 150);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleBackPress = () => {
    slideAnimation.value = withTiming(SCREEN_WIDTH, { duration: 300 });
    
    setTimeout(() => {
      setCurrentStep('role');
      setPin('');
      setEmail('');
      setPassword('');
      setError('');
      slideAnimation.value = -SCREEN_WIDTH;
      slideAnimation.value = withTiming(0, { duration: 300 });
    }, 150);
  };

  const handlePINComplete = async (completedPin: string) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = await AuthService.signInWithPIN(completedPin, selectedRole);
      
      if (result.success && result.user) {
        // Success animation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(result.user, selectedRole);
      } else {
        throw new Error(result.error || 'Invalid PIN');
      }
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setError(getErrorMessage(newAttemptCount));
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate(200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in to Harry School ${selectedRole === 'teacher' ? 'Teacher' : 'Student'} App`,
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN Instead',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // In a real app, you'd use stored credentials here
        onSuccess({ id: 'biometric-user', role: selectedRole }, selectedRole);
      }
    } catch (error) {
      console.log('Biometric auth error:', error);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await AuthService.signInWithEmail(email, password);
      
      if (result.success && result.user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(result.user, selectedRole);
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setError(getErrorMessage(newAttemptCount));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (attempt: number): string => {
    const messages = [
      'Please check your credentials and try again.',
      'Still having trouble? Make sure your information is correct.',
      'Need help? Try using a different sign-in method.',
      'Having persistent issues? Contact your administrator for assistance.',
    ];
    return messages[Math.min(attempt - 1, messages.length - 1)] || messages[0];
  };

  const handlePINChange = (newPin: string) => {
    if (newPin.length <= 6) {
      setPin(newPin);
      setError('');
    }
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < 6) {
      handlePINChange(pin + number);
    }
  };

  const handleDeletePress = () => {
    handlePINChange(pin.slice(0, -1));
  };

  const renderRoleSelection = () => (
    <View style={styles.roleContainer}>
      <Text style={[styles.title, { color: theme.tokens.colors.neutral[900] }]}>
        Choose Your Role
      </Text>
      <Text style={[styles.subtitle, { color: theme.tokens.colors.neutral[600] }]}>
        Select how you'll be using Harry School
      </Text>

      <View style={styles.roleOptions}>
        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: theme.tokens.colors.neutral[50] }]}
          onPress={() => handleRoleSelection('teacher')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleIcon}>👨‍🏫</Text>
          <Text style={[styles.roleTitle, { color: theme.tokens.colors.neutral[900] }]}>
            Teacher Access
          </Text>
          <Text style={[styles.roleDescription, { color: theme.tokens.colors.neutral[600] }]}>
            Quick access with PIN or biometric login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: theme.tokens.colors.neutral[50] }]}
          onPress={() => handleRoleSelection('student')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleIcon}>👨‍🎓</Text>
          <Text style={[styles.roleTitle, { color: theme.tokens.colors.neutral[900] }]}>
            Student Access
          </Text>
          <Text style={[styles.roleDescription, { color: theme.tokens.colors.neutral[600] }]}>
            Secure access to your learning materials
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.helpText, { color: theme.tokens.colors.neutral[500] }]}>
        Need help? Contact your administrator
      </Text>
    </View>
  );

  const renderTeacherAuth = () => (
    <View style={styles.authContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Text style={[styles.backButtonText, { color: theme.tokens.colors.primary[500] }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      <Text style={[styles.welcomeText, { color: theme.tokens.colors.neutral[900] }]}>
        👨‍🏫 Welcome Back, Teacher
      </Text>

      {authMethod === 'pin' && (
        <>
          <Text style={[styles.instructionText, { color: theme.tokens.colors.neutral[600] }]}>
            Enter your {selectedRole === 'teacher' ? '4-digit PIN' : 'credentials'}
          </Text>

          <PINInput
            length={4}
            value={pin}
            onComplete={handlePINComplete}
            isError={!!error}
            onChangeText={handlePINChange}
          />

          <NumberPad
            onNumberPress={handleNumberPress}
            onDeletePress={handleDeletePress}
            theme={theme}
          />

          {biometricType && (
            <TouchableOpacity
              style={[styles.biometricButton, { borderColor: theme.tokens.colors.primary[500] }]}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              <Text style={[styles.biometricButtonText, { color: theme.tokens.colors.primary[500] }]}>
                👆 Use {biometricType === LocalAuthentication.AuthenticationType.FINGERPRINT ? 'Fingerprint' : 'Face ID'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => setAuthMethod('email')}
          >
            <Text style={[styles.alternativeButtonText, { color: theme.tokens.colors.neutral[600] }]}>
              Forgot PIN? Use Password
            </Text>
          </TouchableOpacity>
        </>
      )}

      {authMethod === 'email' && (
        <>
          <Text style={[styles.instructionText, { color: theme.tokens.colors.neutral[600] }]}>
            Sign in with your email and password
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { 
                borderColor: theme.tokens.colors.neutral[300],
                color: theme.tokens.colors.neutral[900],
              }]}
              placeholder="📧 Email Address"
              placeholderTextColor={theme.tokens.colors.neutral[500]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={[styles.textInput, { 
                borderColor: theme.tokens.colors.neutral[300],
                color: theme.tokens.colors.neutral[900],
              }]}
              placeholder="🔐 Password"
              placeholderTextColor={theme.tokens.colors.neutral[500]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              style={[styles.signInButton, { 
                backgroundColor: theme.tokens.colors.primary[500],
                opacity: (!email || !password || isLoading) ? 0.6 : 1,
              }]}
              onPress={handleEmailAuth}
              disabled={!email || !password || isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => setAuthMethod('pin')}
          >
            <Text style={[styles.alternativeButtonText, { color: theme.tokens.colors.primary[500] }]}>
              ← Back to PIN
            </Text>
          </TouchableOpacity>
        </>
      )}

      {error ? (
        <Text style={[styles.errorText, { color: theme.tokens.colors.semantic.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );

  const renderStudentAuth = () => (
    <View style={styles.authContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Text style={[styles.backButtonText, { color: theme.tokens.colors.primary[500] }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      <Text style={[styles.welcomeText, { color: theme.tokens.colors.neutral[900] }]}>
        📚 Ready to Learn?
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, { 
            borderColor: theme.tokens.colors.neutral[300],
            color: theme.tokens.colors.neutral[900],
          }]}
          placeholder="📧 Your Email"
          placeholderTextColor={theme.tokens.colors.neutral[500]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.textInput, { 
            borderColor: theme.tokens.colors.neutral[300],
            color: theme.tokens.colors.neutral[900],
          }]}
          placeholder="🔐 Password"
          placeholderTextColor={theme.tokens.colors.neutral[500]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.signInButton, { 
            backgroundColor: theme.tokens.colors.primary[500],
            opacity: (!email || !password || isLoading) ? 0.6 : 1,
          }]}
          onPress={handleEmailAuth}
          disabled={!email || !password || isLoading}
        >
          <Text style={styles.signInButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In 🚀'}
          </Text>
        </TouchableOpacity>
      </View>

      {biometricType && (
        <TouchableOpacity
          style={[styles.biometricButton, { borderColor: theme.tokens.colors.primary[500] }]}
          onPress={handleBiometricAuth}
          disabled={isLoading}
        >
          <Text style={[styles.biometricButtonText, { color: theme.tokens.colors.primary[500] }]}>
            👆 Use {biometricType === LocalAuthentication.AuthenticationType.FINGERPRINT ? 'Fingerprint' : 'Face ID'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.helpText, { color: theme.tokens.colors.neutral[500] }]}>
        Trouble signing in? Contact your teacher
      </Text>

      {error ? (
        <Text style={[styles.errorText, { color: theme.tokens.colors.semantic.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.tokens.colors.neutral[25] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.tokens.colors.neutral[25]} />
      
      <LinearGradient
        colors={[theme.tokens.colors.neutral[25], '#ffffff']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View style={[styles.content, animatedSlideStyle]}>
            {currentStep === 'role' && renderRoleSelection()}
            {currentStep === 'auth' && selectedRole === 'teacher' && renderTeacherAuth()}
            {currentStep === 'auth' && selectedRole === 'student' && renderStudentAuth()}
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  
  // Role Selection Styles
  roleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  roleOptions: {
    width: '100%',
    marginBottom: 32,
  },
  roleCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29, 116, 82, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Auth Container Styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  
  // PIN Input Styles
  pinContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pinCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 8,
  },
  
  // Number Pad Styles
  numberPad: {
    alignItems: 'center',
    marginBottom: 32,
  },
  numberRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  numberButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '400',
  },
  
  // Input Styles
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  
  // Button Styles
  signInButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  alternativeButton: {
    alignItems: 'center',
    padding: 12,
  },
  alternativeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Utility Styles
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});