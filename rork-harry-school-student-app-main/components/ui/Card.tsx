import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  testID?: string;
}

export default function Card({ children, style, padding = 16, testID }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});