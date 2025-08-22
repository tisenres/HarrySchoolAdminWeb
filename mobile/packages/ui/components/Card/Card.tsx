/**
 * Card Component - REAL Implementation
 * Based on International Student App Screenshots
 * 
 * ACTUAL working card with white/dark background, shadow, padding, rounded corners
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';

export interface CardProps {
  children: ReactNode;
  variant?: 'light' | 'dark';
  style?: ViewStyle;
  testID?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'dark',
  style,
  testID,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle = [styles.card];
    
    switch (variant) {
      case 'light':
        baseStyle.push(styles.lightCard);
        break;
      case 'dark':
        baseStyle.push(styles.darkCard);
        break;
    }

    return StyleSheet.flatten(baseStyle);
  };

  return (
    <View
      style={[getCardStyle(), style]}
      testID={testID}
      accessibilityRole="none"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  card: {
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Light variant (for light theme)
  lightCard: {
    backgroundColor: '#ffffff',
  },

  // Dark variant (for dark theme from screenshots)
  darkCard: {
    backgroundColor: '#2d2d2d', // Dark card background from screenshots
  },
});

export default Card;