import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error:', error);
    console.error('[ErrorBoundary] Info:', info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="global-error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.error?.message ?? 'Unexpected error'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} testID="retry-app">
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 24 },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 8 },
  message: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: FontWeights.semibold, fontSize: FontSizes.base },
});
