import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/design';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate logo appearance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate title after logo
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>HS</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Harry School</Text>
          <Text style={styles.subtitle}>Student App</Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingFill,
                {
                  width: logoOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading your learning journey...</Text>
        </View>
      </View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  logoContainer: {
    marginBottom: SPACING['4xl'],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    letterSpacing: -2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING['5xl'],
  },
  title: {
    fontSize: TYPOGRAPHY['4xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING['3xl'],
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.base,
  },
  loadingFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: SPACING['5xl'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: SPACING.xs,
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
});