import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { isSupabaseEnabled } from '@/lib/supabase';

const DEMO_EMAIL = 'john.smith@harry-school.test';
const DEMO_PASSWORD = 'demo123';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { signIn, error: authError } = useAuth();

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      const success = await signIn({ email, password });
      
      if (success) {
        console.log('Login successful, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        const errorMessage = authError || 'Login failed. Please check your credentials.';
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      console.log('Creating test user...');
      const { user, error } = await authService.createTestUser();
      
      if (error) {
        if (error.message?.includes('already registered')) {
          Alert.alert('Info', 'Test user already exists! You can now sign in with the demo credentials.');
        } else {
          Alert.alert('Error', `Failed to create test user: ${error.message}`);
        }
      } else if (user) {
        Alert.alert('Success', 'Test user created successfully! You can now sign in with the demo credentials.');
        fillDemo();
      }
    } catch (error) {
      console.error('Create test user error:', error);
      Alert.alert('Error', 'An unexpected error occurred while creating test user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradient.primary}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title} testID="login-title">Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={'rgba(255,255,255,0.7)'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="email-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={'rgba(255,255,255,0.7)'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  testID="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff size={20} color={'#ffffff'} />
                  ) : (
                    <Eye size={20} color={'#ffffff'} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Reset Password', 'Password reset will be available when backend is connected.')} testID="forgot-password-button">
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
                testID="sign-in-button"
              />

              <Button
                title="Use Demo Account"
                onPress={fillDemo}
                variant="outline"
                style={styles.demoButton}
                testID="fill-demo-button"
              />

              <Button
                title="Continue as Demo"
                onPress={async () => {
                  if (loading) return;
                  setLoading(true);
                  try {
                    const ok = await signIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
                    if (ok) {
                      router.replace('/(tabs)');
                    } else {
                      Alert.alert('Login Failed', authError || 'Unable to start demo session.');
                    }
                  } catch (e) {
                    Alert.alert('Error', 'Failed to start demo session');
                  } finally {
                    setLoading(false);
                  }
                }}
                style={styles.demoButton}
                testID="continue-demo-button"
              />

              <Button
                title="Create Test User"
                onPress={() => {
                  if (!isSupabaseEnabled) {
                    Alert.alert('Not available', 'Backend is not connected. This action requires Supabase keys.');
                    return;
                  }
                  void createTestUser();
                }}
                variant="outline"
                style={[styles.demoButton, { backgroundColor: 'rgba(255,255,255,0.1)', opacity: isSupabaseEnabled ? 1 : 0.6 }]}
                disabled={!isSupabaseEnabled || loading}
                testID="create-test-user-button"
              />

              <View style={styles.demoBox} testID="demo-credentials">
                <Text style={styles.demoLabel}>Demo credentials</Text>
                <Text style={styles.demoValue}>Email: {DEMO_EMAIL}</Text>
                <Text style={styles.demoValue}>Password: {DEMO_PASSWORD}</Text>
                <Text style={styles.demoNote}>1. Tap "Use Demo Account" to auto-fill</Text>
                <Text style={styles.demoNote}>2. Tap "Sign In" to continue (works fully offline)</Text>
                <Text style={styles.demoWarning}>When keys are provided, sign-in will switch to real backend automatically.</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don&apos;t have an account? <Text style={styles.signUpText}>Contact your school</Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold,
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.base,
    color: '#ffffff',
    fontWeight: FontWeights.medium,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FontWeights.medium,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  demoButton: {
    marginTop: 8,
    borderColor: '#ffffff',
  },
  demoBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  demoLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeights.semibold,
    marginBottom: 4,
  },
  demoValue: {
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 36,
  },
  footerText: {
    fontSize: FontSizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  signUpText: {
    color: '#ffffff',
    fontWeight: FontWeights.semibold,
  },
  demoNote: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
  demoWarning: {
    color: 'rgba(255,200,100,0.9)',
    fontSize: FontSizes.xs,
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: FontWeights.medium,
  },
});