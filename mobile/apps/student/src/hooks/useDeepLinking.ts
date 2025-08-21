/**
 * Deep Linking Hook for Harry School Student App
 * 
 * React hook for managing deep linking with age-appropriate security
 */

import { useEffect, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { deepLinkingService, DeepLinkConfig, DeepLinkResult } from '../services/deepLinking.service';

interface UseDeepLinkingConfig {
  studentAge: number;
  isAuthenticated: boolean;
  parentalSettings: {
    oversightRequired: boolean;
    familyNotifications: boolean;
    restrictedFeatures: string[];
    approvedTeachers: string[];
  };
}

interface UseDeepLinkingReturn {
  handleDeepLink: (url: string) => Promise<void>;
  isProcessing: boolean;
  lastError: string | null;
  clearError: () => void;
}

export const useDeepLinking = (config: UseDeepLinkingConfig): UseDeepLinkingReturn => {
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const { studentAge, isAuthenticated, parentalSettings } = config;

  /**
   * Handle incoming deep link with comprehensive validation
   */
  const handleDeepLink = useCallback(async (url: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLastError(null);

    try {
      const deepLinkConfig: DeepLinkConfig = {
        url,
        studentAge,
        authenticationStatus: isAuthenticated ? 'authenticated' : 'unauthenticated',
        parentalSettings
      };

      const result: DeepLinkResult = await deepLinkingService.handleDeepLink(deepLinkConfig);

      if (result.success) {
        // Deep link handled successfully - navigation already occurred
        console.log('✅ Deep link processed successfully:', result.route);
      } else {
        // Handle different types of failures
        await handleDeepLinkFailure(result);
      }
    } catch (error) {
      console.error('❌ Deep link processing error:', error);
      setLastError(error.message);
      showErrorAlert('Navigation Error', 'Unable to process the link. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [studentAge, isAuthenticated, parentalSettings, isProcessing]);

  /**
   * Handle different types of deep link failures
   */
  const handleDeepLinkFailure = async (result: DeepLinkResult) => {
    setLastError(result.error || 'Unknown error');

    switch (result.action) {
      case 'redirect_to_login':
        showAuthenticationAlert();
        break;
        
      case 'show_age_restriction_dialog':
        showAgeRestrictionAlert(result.error || 'Access restricted');
        break;
        
      case 'request_parental_approval':
        showParentalApprovalAlert(result.metadata);
        break;
        
      case 'show_navigation_error':
        showErrorAlert('Navigation Error', result.error || 'Unable to navigate to the requested page');
        break;
        
      default:
        showErrorAlert('Link Error', result.error || 'Unable to process the link');
    }
  };

  /**
   * Show authentication required alert
   */
  const showAuthenticationAlert = () => {
    Alert.alert(
      'Sign In Required',
      'You need to sign in to access this content.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign In', 
          onPress: () => {
            // Navigate to authentication screen
            navigation.navigate('Auth' as never);
          }
        }
      ]
    );
  };

  /**
   * Show age restriction alert with educational content
   */
  const showAgeRestrictionAlert = (message: string) => {
    const ageAppropriateMessage = getAgeAppropriateMessage(message, studentAge);
    
    Alert.alert(
      'Access Limited',
      ageAppropriateMessage,
      [
        { text: 'OK', style: 'default' },
        ...(studentAge <= 12 ? [{
          text: 'Ask Parent',
          onPress: () => requestParentalHelp()
        }] : [])
      ]
    );
  };

  /**
   * Show parental approval request alert
   */
  const showParentalApprovalAlert = (metadata?: any) => {
    const message = studentAge <= 12 
      ? 'This action needs your parent or guardian\'s permission. Would you like to ask them?'
      : 'This requires parental approval. You can request permission in your profile settings.';

    Alert.alert(
      'Permission Needed',
      message,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: studentAge <= 12 ? 'Ask Parent' : 'Request Permission', 
          onPress: () => requestParentalApproval(metadata)
        }
      ]
    );
  };

  /**
   * Show generic error alert
   */
  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', style: 'default' }]
    );
  };

  /**
   * Get age-appropriate error message
   */
  const getAgeAppropriateMessage = (message: string, age: number): string => {
    if (age <= 12) {
      // Elementary: Simple, friendly language
      const elementaryMessages: Record<string, string> = {
        'Parental supervision required': 'You need a parent or guardian to help you with this.',
        'Not enrolled in this class': 'This class is not in your schedule yet.',
        'privacy settings not available for your age': 'These settings are for older students.',
        'advanced settings not available for your age': 'These options are for high school students.'
      };
      return elementaryMessages[message] || 'You need permission to access this.';
    } else if (age <= 15) {
      // Middle School: Educational guidance
      const middleSchoolMessages: Record<string, string> = {
        'Parental supervision required': 'Your parents help manage this setting for your safety.',
        'payments settings not available for your age': 'Payment settings become available in high school.',
        'advanced settings not available for your age': 'Advanced settings are unlocked for older students.'
      };
      return middleSchoolMessages[message] || message;
    } else {
      // High School: Full explanations
      return message;
    }
  };

  /**
   * Request parental help (for elementary students)
   */
  const requestParentalHelp = () => {
    if (parentalSettings.familyNotifications) {
      // In real app, this would send a notification to parents
      Alert.alert(
        'Parent Notified',
        'Your parent will be notified that you need help with this.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Ask Your Parent',
        'Please ask your parent or guardian to help you with this on their device.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  /**
   * Request parental approval (for middle/high school students)
   */
  const requestParentalApproval = (metadata?: any) => {
    // Navigate to approval request screen
    navigation.navigate('Profile' as never, {
      screen: 'RequestApproval',
      params: { metadata }
    } as never);
  };

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  /**
   * Set up deep linking listeners on mount
   */
  useEffect(() => {
    // Handle initial URL (when app launches from deep link)
    const handleInitialURL = async () => {
      try {
        const initialURL = await deepLinkingService.getInitialURL();
        if (initialURL) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleDeepLink(initialURL);
          }, 1000);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    // Handle URLs while app is running
    const removeListener = deepLinkingService.addLinkingListener((url: string) => {
      handleDeepLink(url);
    });

    // Initialize deep linking service with navigation
    deepLinkingService.setNavigationRef(navigation.getParent() || navigation);

    // Handle initial URL
    handleInitialURL();

    // Cleanup
    return () => {
      removeListener();
    };
  }, [handleDeepLink, navigation]);

  return {
    handleDeepLink,
    isProcessing,
    lastError,
    clearError
  };
};