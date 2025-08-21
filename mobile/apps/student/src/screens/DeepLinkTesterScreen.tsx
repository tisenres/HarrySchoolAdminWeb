/**
 * Deep Link Tester Screen
 * 
 * Full screen wrapper for the DeepLinkTester component
 */

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DeepLinkTester } from '../components/DeepLinkTester';

export const DeepLinkTesterScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deep Link Testing</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Deep Link Tester Component */}
      <DeepLinkTester
        studentAge={14} // Mock age for testing
        isAuthenticated={true} // Mock authentication status
      />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40, // Same width as close button for centering
  },
});