import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useBiometric, useDeviceTrust } from '../../hooks/useAuth';

interface BiometricSetupScreenProps {
  onSetupComplete?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
  style?: any;
}

export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  onSetupComplete,
  onSkip,
  showSkipOption = true,
  style,
}) => {
  const {
    biometricInfo,
    setupBiometric,
    isLoading,
    error,
  } = useBiometric();

  const { isDeviceTrusted, trustDevice } = useDeviceTrust();

  const [currentStep, setCurrentStep] = useState<'check' | 'trust' | 'setup' | 'complete'>('check');
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (biometricInfo) {
      if (!biometricInfo.available) {
        setSetupError('Biometric hardware is not available on this device');
      } else if (!biometricInfo.enrolled) {
        setSetupError('No biometric data is enrolled on this device. Please set up biometric authentication in your device settings first.');
      } else if (!isDeviceTrusted) {
        setCurrentStep('trust');
      } else {
        setCurrentStep('setup');
      }
    }
  }, [biometricInfo, isDeviceTrusted]);

  const handleTrustDevice = async () => {
    try {
      setSetupError(null);
      await trustDevice();
      setCurrentStep('setup');
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Failed to trust device');
    }
  };

  const handleSetupBiometric = async () => {
    try {
      setSetupError(null);
      await setupBiometric();
      setCurrentStep('complete');
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Failed to setup biometric authentication');
    }
  };

  const handleComplete = () => {
    onSetupComplete?.();
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Biometric Setup',
      'You can set up biometric authentication later in settings. Are you sure you want to skip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onSkip },
      ]
    );
  };

  const getBiometricTypeDisplay = () => {
    if (!biometricInfo) return 'Biometric';

    if (biometricInfo.securityLevel === 'strong') {
      return 'Face ID / Touch ID';
    } else {
      return 'Biometric';
    }
  };

  const renderCheckStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔒</Text>
      </View>
      <Text style={styles.stepTitle}>Checking Biometric Availability</Text>
      <Text style={styles.stepDescription}>
        We're checking if your device supports biometric authentication...
      </Text>
      <ActivityIndicator size="large" color="#1D7452" style={styles.loader} />
    </View>
  );

  const renderTrustStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📱</Text>
      </View>
      <Text style={styles.stepTitle}>Trust This Device</Text>
      <Text style={styles.stepDescription}>
        To enable biometric authentication, we need to mark this device as trusted. This enhances security by ensuring only your trusted devices can use biometric sign-in.
      </Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleTrustDevice}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Trust This Device</Text>
        )}
      </TouchableOpacity>

      {showSkipOption && (
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSetupStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>👆</Text>
      </View>
      <Text style={styles.stepTitle}>Enable {getBiometricTypeDisplay()}</Text>
      <Text style={styles.stepDescription}>
        Set up biometric authentication for quick and secure access to your account. You'll be able to sign in using your fingerprint or face instead of typing your password.
      </Text>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <Text style={styles.benefit}>• Faster sign-in process</Text>
        <Text style={styles.benefit}>• Enhanced security</Text>
        <Text style={styles.benefit}>• No need to remember passwords</Text>
        <Text style={styles.benefit}>• Works offline</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSetupBiometric}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Enable Biometric Sign-In</Text>
        )}
      </TouchableOpacity>

      {showSkipOption && (
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
      </View>
      <Text style={styles.stepTitle}>Setup Complete!</Text>
      <Text style={styles.stepDescription}>
        Biometric authentication has been successfully enabled. You can now sign in using your {getBiometricTypeDisplay().toLowerCase()} for a faster and more secure experience.
      </Text>

      <View style={styles.successContainer}>
        <Text style={styles.successText}>
          Next time you open the app, you'll be prompted to use biometric authentication automatically.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      <Text style={styles.stepTitle}>Setup Not Available</Text>
      <Text style={styles.stepDescription}>{setupError}</Text>

      {setupError?.includes('not enrolled') && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>To enable biometric authentication:</Text>
          <Text style={styles.instruction}>1. Go to your device Settings</Text>
          <Text style={styles.instruction}>2. Find Security or Biometric settings</Text>
          <Text style={styles.instruction}>3. Set up fingerprint or face recognition</Text>
          <Text style={styles.instruction}>4. Return to this app and try again</Text>
        </View>
      )}

      {showSkipOption && (
        <TouchableOpacity style={styles.primaryButton} onPress={onSkip}>
          <Text style={styles.primaryButtonText}>Continue Without Biometric</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Biometric Authentication</Text>
          <Text style={styles.subtitle}>Secure and convenient sign-in</Text>
        </View>

        {setupError ? renderError() : (
          <>
            {currentStep === 'check' && renderCheckStep()}
            {currentStep === 'trust' && renderTrustStep()}
            {currentStep === 'setup' && renderSetupStep()}
            {currentStep === 'complete' && renderCompleteStep()}
          </>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 16,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 6,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#1D7452',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BiometricSetupScreen;