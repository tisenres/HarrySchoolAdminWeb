import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthForm, useBiometric, useDeviceTrust } from '../../hooks/useAuth';

interface SignInScreenProps {
  onSignInSuccess?: () => void;
  onForgotPassword?: () => void;
  showBiometricOption?: boolean;
  showRememberDevice?: boolean;
  style?: any;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignInSuccess,
  onForgotPassword,
  showBiometricOption = true,
  showRememberDevice = true,
  style,
}) => {
  const {
    credentials,
    updateCredentials,
    handleSignIn,
    handleBiometricSignIn,
    resetForm,
    isLoading,
    error,
    clearError,
    canUseBiometric,
  } = useAuthForm();

  const { isBiometricSetup } = useBiometric();
  const { isDeviceTrusted } = useDeviceTrust();

  const [showPassword, setShowPassword] = useState(false);
  const [hasAttemptedBiometric, setHasAttemptedBiometric] = useState(false);

  // Auto-attempt biometric signin if available and device is trusted
  useEffect(() => {
    if (
      showBiometricOption &&
      canUseBiometric &&
      isBiometricSetup &&
      isDeviceTrusted &&
      !hasAttemptedBiometric &&
      !isLoading
    ) {
      setHasAttemptedBiometric(true);
      handleBiometricSignIn({
        promptMessage: 'Sign in with biometric authentication',
        fallbackLabel: 'Use Password',
      }).catch(() => {
        // Silent fail for auto-attempt
      });
    }
  }, [
    canUseBiometric,
    isBiometricSetup,
    isDeviceTrusted,
    hasAttemptedBiometric,
    isLoading,
    showBiometricOption,
    handleBiometricSignIn,
  ]);

  const handleFormSignIn = async () => {
    try {
      clearError();
      await handleSignIn();
      onSignInSuccess?.();
    } catch (err) {
      // Error is handled by the hook
      console.error('Sign in failed:', err);
    }
  };

  const handleBiometricAttempt = async () => {
    try {
      clearError();
      await handleBiometricSignIn({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use Password',
      });
      onSignInSuccess?.();
    } catch (err) {
      if (err instanceof Error && err.message === 'FALLBACK_REQUIRED') {
        // User chose to use password instead
        return;
      }
      // Other errors are handled by the hook
    }
  };

  const handleForgotPassword = () => {
    onForgotPassword?.();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Biometric Sign In Option */}
        {showBiometricOption && canUseBiometric && isBiometricSetup && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAttempt}
            disabled={isLoading}
          >
            <Text style={styles.biometricButtonText}>
              🔒 Sign in with Biometric
            </Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        {showBiometricOption && canUseBiometric && isBiometricSetup && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={credentials.email}
            onChangeText={(email) => updateCredentials({ email })}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={credentials.password}
              onChangeText={(password) => updateCredentials({ password })}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {showRememberDevice && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                updateCredentials({ rememberDevice: !credentials.rememberDevice })
              }
              disabled={isLoading}
            >
              <View style={[
                styles.checkbox,
                credentials.rememberDevice && styles.checkboxChecked,
              ]}>
                {credentials.rememberDevice && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Remember this device</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.signInButton,
            isLoading && styles.signInButtonDisabled,
          ]}
          onPress={handleFormSignIn}
          disabled={isLoading || !credentials.email || !credentials.password}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Additional Options */}
        <View style={styles.additionalOptions}>
          <Text style={styles.helpText}>
            Having trouble signing in? Contact your administrator.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  biometricButton: {
    backgroundColor: '#1D7452',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordToggleText: {
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1D7452',
    borderColor: '#1D7452',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1D7452',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#1D7452',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalOptions: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SignInScreen;