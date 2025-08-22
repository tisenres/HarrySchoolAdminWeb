import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/design';

export default function ReferralsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Refer Friends</Text>
        <Text style={styles.subtitle}>Friend referral system coming soon!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  title: { fontSize: TYPOGRAPHY['2xl'], fontWeight: TYPOGRAPHY.bold, color: COLORS.text, marginBottom: SPACING.base },
  subtitle: { fontSize: TYPOGRAPHY.base, color: COLORS.textSecondary },
});