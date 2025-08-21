/**
 * PlaceholderScreen Component
 * 
 * Temporary screen component for navigation development
 * Shows screen structure and planned features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

interface PlaceholderScreenProps {
  title: string;
  description: string;
  features: string[];
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  description,
  features,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.tokens.colors.neutral[25],
    },
    content: {
      flex: 1,
      padding: 24,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.tokens.colors.neutral[900],
      marginBottom: 12,
      fontFamily: theme.tokens.typography.fontFamily.bold,
    },
    description: {
      fontSize: 16,
      color: theme.tokens.colors.neutral[600],
      lineHeight: 24,
      fontFamily: theme.tokens.typography.fontFamily.regular,
    },
    featuresSection: {
      flex: 1,
    },
    featuresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.tokens.colors.neutral[900],
      marginBottom: 16,
      fontFamily: theme.tokens.typography.fontFamily.semiBold,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.tokens.colors.neutral[50],
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.tokens.colors.primary[500],
    },
    featureBullet: {
      fontSize: 16,
      color: theme.tokens.colors.primary[500],
      marginRight: 12,
      marginTop: 2,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      color: theme.tokens.colors.neutral[700],
      lineHeight: 22,
      fontFamily: theme.tokens.typography.fontFamily.regular,
    },
    backButton: {
      backgroundColor: theme.tokens.colors.primary[500],
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      alignSelf: 'center',
      marginTop: 24,
      shadowColor: theme.tokens.colors.primary[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    backButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: theme.tokens.typography.fontFamily.semiBold,
    },
    developmentBadge: {
      position: 'absolute',
      top: 60,
      right: 16,
      backgroundColor: theme.tokens.colors.semantic.warning,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      zIndex: 1000,
    },
    developmentBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      fontFamily: theme.tokens.typography.fontFamily.semiBold,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.developmentBadge}>
        <Text style={styles.developmentBadgeText}>IN DEVELOPMENT</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Planned Features:</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>✨</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};