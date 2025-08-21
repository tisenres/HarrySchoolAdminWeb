/**
 * Deep Link Tester Component
 * 
 * Development component for testing deep linking functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeepLinking } from '../hooks/useDeepLinking';

interface DeepLinkTesterProps {
  studentAge: number;
  isAuthenticated: boolean;
}

export const DeepLinkTester: React.FC<DeepLinkTesterProps> = ({
  studentAge,
  isAuthenticated
}) => {
  const [testUrl, setTestUrl] = useState('');
  
  const { handleDeepLink, isProcessing, lastError, clearError } = useDeepLinking({
    studentAge,
    isAuthenticated,
    parentalSettings: {
      oversightRequired: studentAge <= 12,
      familyNotifications: true,
      restrictedFeatures: [],
      approvedTeachers: []
    }
  });

  const predefinedUrls = [
    {
      label: 'Home',
      url: 'harryschool://home',
      description: 'Navigate to home screen'
    },
    {
      label: 'Schedule Calendar',
      url: 'harryschool://schedule/month',
      description: 'Open calendar in month view'
    },
    {
      label: 'Weekly Schedule',
      url: 'harryschool://schedule/week',
      description: 'Open calendar in week view'
    },
    {
      label: 'Class Details',
      url: 'harryschool://class/math-101/view',
      description: 'View specific class details'
    },
    {
      label: 'Profile Overview',
      url: 'harryschool://profile/overview',
      description: 'Open profile overview'
    },
    {
      label: 'Profile Settings',
      url: 'harryschool://profile/settings',
      description: 'Open profile settings'
    },
    {
      label: 'General Settings',
      url: 'harryschool://settings/general',
      description: 'Open general settings'
    },
    {
      label: 'Privacy Settings',
      url: 'harryschool://settings/privacy',
      description: 'Open privacy settings (age-restricted)'
    },
    {
      label: 'Request Extra Lesson',
      url: 'harryschool://request/lesson/create',
      description: 'Create new lesson request'
    },
    {
      label: 'Vocabulary Flashcards',
      url: 'harryschool://vocabulary/flashcards',
      description: 'Open vocabulary flashcards'
    }
  ];

  const handleTestUrl = async (url: string) => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL to test');
      return;
    }

    try {
      await handleDeepLink(url.trim());
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePredefinedUrl = async (url: string) => {
    setTestUrl(url);
    await handleTestUrl(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="link" size={24} color="#1d7452" />
        <Text style={styles.title}>Deep Link Tester</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Settings</Text>
        <Text style={styles.infoText}>Age: {studentAge}</Text>
        <Text style={styles.infoText}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={styles.infoText}>
          Parental Oversight: {studentAge <= 12 ? 'Required' : 'Optional'}
        </Text>
      </View>

      {lastError && (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.errorTitle}>Last Error</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorClose}>
              <Ionicons name="close" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom URL Test</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={testUrl}
            onChangeText={setTestUrl}
            placeholder="harryschool://schedule/week"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.testButton, isProcessing && styles.testButtonDisabled]}
            onPress={() => handleTestUrl(testUrl)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Ionicons name="hourglass" size={16} color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
            <Text style={styles.testButtonText}>
              {isProcessing ? 'Testing...' : 'Test'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Predefined Tests</Text>
        {predefinedUrls.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.predefinedItem}
            onPress={() => handlePredefinedUrl(item.url)}
            disabled={isProcessing}
          >
            <View style={styles.predefinedContent}>
              <Text style={styles.predefinedLabel}>{item.label}</Text>
              <Text style={styles.predefinedDescription}>{item.description}</Text>
              <Text style={styles.predefinedUrl}>{item.url}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Restrictions Demo</Text>
        <Text style={styles.ageInfo}>
          Based on your age ({studentAge}), the following restrictions apply:
        </Text>
        {studentAge <= 12 && (
          <View style={styles.restrictionItem}>
            <Ionicons name="shield-checkmark" size={16} color="#f59e0b" />
            <Text style={styles.restrictionText}>
              Privacy settings require parental oversight
            </Text>
          </View>
        )}
        {studentAge <= 15 && (
          <View style={styles.restrictionItem}>
            <Ionicons name="card" size={16} color="#f59e0b" />
            <Text style={styles.restrictionText}>
              Payment requests need parental approval
            </Text>
          </View>
        )}
        {studentAge >= 16 && (
          <View style={styles.restrictionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.restrictionText}>
              Full access to all features
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1d7452',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
    flex: 1,
  },
  errorClose: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
    marginRight: 8,
  },
  testButton: {
    backgroundColor: '#1d7452',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  predefinedItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  predefinedContent: {
    flex: 1,
  },
  predefinedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  predefinedDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  predefinedUrl: {
    fontSize: 12,
    color: '#1d7452',
    fontFamily: 'monospace',
  },
  ageInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restrictionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
});