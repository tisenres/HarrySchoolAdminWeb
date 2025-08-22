import React, { 
  Suspense, 
  lazy, 
  ComponentType, 
  useState, 
  useEffect, 
  useRef,
  memo 
} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Dimensions,
  Platform,
  InteractionManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Canvas, Rect, Path, Skia } from '@shopify/react-native-skia';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LazyLoadConfig {
  preloadDelay?: number;
  fadeInDuration?: number;
  enableSkeleton?: boolean;
  enableProgressBar?: boolean;
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  respectPrayerTime?: boolean;
  showLoadingText?: boolean;
  loadingMessages?: {
    en: string;
    uz: string;
    ru: string;
    ar: string;
  };
  priority?: 'low' | 'normal' | 'high';
}

interface LazyScreenProps {
  config?: LazyLoadConfig;
  fallback?: React.ComponentType;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const defaultConfig: Required<LazyLoadConfig> = {
  preloadDelay: 100,
  fadeInDuration: 300,
  enableSkeleton: true,
  enableProgressBar: true,
  culturalTheme: 'modern',
  respectPrayerTime: true,
  showLoadingText: true,
  loadingMessages: {
    en: 'Loading...',
    uz: 'Yuklanmoqda...',
    ru: 'Загрузка...',
    ar: '...جاري التحميل',
  },
  priority: 'normal',
};

// Enhanced Loading Component
const LazyLoadingFallback: React.FC<{
  config: Required<LazyLoadConfig>;
  progress?: number;
}> = memo(({ config, progress = 0 }) => {
  const fadeOpacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  const skeletonAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  const [currentLanguage] = useState<keyof typeof config.loadingMessages>('en');

  useEffect(() => {
    // Fade in animation
    fadeOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });

    // Skeleton shimmer animation
    if (config.enableSkeleton) {
      const startSkeletonAnimation = () => {
        skeletonAnimation.value = withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }, () => {
          skeletonAnimation.value = withTiming(0, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }, () => {
            if (skeletonAnimation.value !== -1) { // Check if not cancelled
              runOnJS(startSkeletonAnimation)();
            }
          });
        });
      };
      startSkeletonAnimation();
    }

    // Pulse animation for Islamic theme
    if (config.culturalTheme === 'islamic') {
      const startPulseAnimation = () => {
        pulseAnimation.value = withSpring(1.05, {
          damping: 10,
          stiffness: 100,
        }, () => {
          pulseAnimation.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
          }, () => {
            if (pulseAnimation.value !== -1) {
              runOnJS(startPulseAnimation)();
            }
          });
        });
      };
      startPulseAnimation();
    }

    return () => {
      skeletonAnimation.value = -1; // Cancel animations
      pulseAnimation.value = -1;
    };
  }, []);

  useEffect(() => {
    if (config.enableProgressBar && progress > 0) {
      progressValue.value = withTiming(progress / 100, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [progress]);

  const getCulturalColors = () => {
    switch (config.culturalTheme) {
      case 'islamic':
        return {
          primary: '#1d7452',
          secondary: '#22c55e',
          accent: '#dcfce7',
          background: '#f0f9f0',
          skeleton: ['#e8f5e8', '#f0f9f0'],
        };
      case 'educational':
        return {
          primary: '#2563eb',
          secondary: '#3b82f6',
          accent: '#dbeafe',
          background: '#f0f4ff',
          skeleton: ['#e0e7ff', '#f0f4ff'],
        };
      case 'modern':
      default:
        return {
          primary: '#6b7280',
          secondary: '#9ca3af',
          accent: '#f3f4f6',
          background: '#ffffff',
          skeleton: ['#e1e9ee', '#f2f8fc'],
        };
    }
  };

  const colors = getCulturalColors();

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const skeletonStyle = useAnimatedStyle(() => {
    if (!config.enableSkeleton) return {};
    return {
      opacity: interpolate(skeletonAnimation.value, [0, 1], [0.3, 0.7]),
      transform: [{
        translateX: interpolate(skeletonAnimation.value, [0, 1], [-screenWidth, screenWidth])
      }],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressValue.value, [0, 1], [0, 100])}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value || 1 }],
  }));

  const renderIslamicPattern = () => {
    if (config.culturalTheme !== 'islamic') return null;

    return (
      <Canvas style={styles.islamicPattern}>
        <Path
          path={createIslamicStarPath(screenWidth / 2, screenHeight / 2 - 100, 30)}
          color={colors.primary}
          opacity={0.1}
        />
      </Canvas>
    );
  };

  const renderSkeletonElements = () => {
    if (!config.enableSkeleton) return null;

    return (
      <View style={styles.skeletonContainer}>
        {/* Header skeleton */}
        <View style={[styles.skeletonHeader, { backgroundColor: colors.skeleton[0] }]} />
        
        {/* Content skeletons */}
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={styles.skeletonRow}>
            <View style={[styles.skeletonAvatar, { backgroundColor: colors.skeleton[0] }]} />
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton[0] }]} />
              <View style={[styles.skeletonLineSmall, { backgroundColor: colors.skeleton[1] }]} />
            </View>
          </View>
        ))}

        {/* Animated shimmer overlay */}
        <Animated.View style={[styles.skeletonShimmer, skeletonStyle]}>
          <Canvas style={StyleSheet.absoluteFillObject}>
            <Rect
              x={0}
              y={0}
              width={screenWidth}
              height={screenHeight}
              color="rgba(255, 255, 255, 0.4)"
            />
          </Canvas>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      {/* Islamic pattern background */}
      {renderIslamicPattern()}

      {/* Skeleton loading */}
      {renderSkeletonElements()}

      {/* Loading indicator */}
      <View style={styles.loadingContent}>
        <Animated.View style={pulseStyle}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary}
            style={styles.spinner}
          />
        </Animated.View>

        {/* Loading text */}
        {config.showLoadingText && (
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            {config.loadingMessages[currentLanguage]}
          </Text>
        )}

        {/* Progress bar */}
        {config.enableProgressBar && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.accent }]}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { backgroundColor: colors.primary },
                  progressBarStyle
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.secondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// Prayer time check utility
const checkPrayerTimeRestriction = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const prayerHours = [5, 12, 15, 18, 20];
  return prayerHours.includes(hour);
};

// Islamic star pattern creator
const createIslamicStarPath = (centerX: number, centerY: number, size: number) => {
  const points = 8;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  
  const path = Skia.Path.Make();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  path.close();
  return path;
};

// Enhanced lazy loader with preloading and error boundaries
export function createLazyScreen<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  config?: LazyLoadConfig
): ComponentType<LazyScreenProps> {
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Preload component if high priority
  if (mergedConfig.priority === 'high') {
    setTimeout(() => {
      importFunction().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    }, mergedConfig.preloadDelay);
  }

  const LazyComponent = lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      // Respect prayer time by adding delay
      const prayerTimeDelay = mergedConfig.respectPrayerTime && checkPrayerTimeRestriction() ? 500 : 0;
      
      // Wait for interactions to complete for better UX
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          importFunction()
            .then(resolve)
            .catch(reject);
        }, prayerTimeDelay);
      });
    });
  });

  return memo<LazyScreenProps>(({ config: propsConfig, fallback: Fallback, onLoad, onError, ...props }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [hasError, setHasError] = useState(false);
    const loadingRef = useRef<boolean>(true);
    const finalConfig = { ...mergedConfig, ...propsConfig };

    useEffect(() => {
      // Simulate loading progress for better UX
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95 || !loadingRef.current) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => {
        clearInterval(progressInterval);
      };
    }, []);

    const handleLoad = () => {
      loadingRef.current = false;
      setLoadingProgress(100);
      setTimeout(() => {
        onLoad?.();
      }, finalConfig.fadeInDuration);
    };

    const handleError = (error: Error) => {
      loadingRef.current = false;
      setHasError(true);
      onError?.(error);
    };

    if (hasError) {
      return Fallback ? <Fallback /> : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load screen</Text>
        </View>
      );
    }

    return (
      <Suspense 
        fallback={
          <LazyLoadingFallback 
            config={finalConfig} 
            progress={loadingProgress}
          />
        }
      >
        <LazyComponent 
          {...props}
          onComponentDidMount={handleLoad}
          onComponentDidCatch={handleError}
        />
      </Suspense>
    );
  });
}

// Utility for creating educational screen lazy loaders
export const createEducationalLazyScreen = <T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  screenType: 'student' | 'teacher' | 'admin' = 'student'
) => {
  const config: LazyLoadConfig = {
    culturalTheme: 'educational',
    respectPrayerTime: true,
    enableSkeleton: true,
    enableProgressBar: true,
    priority: screenType === 'teacher' ? 'high' : 'normal',
    loadingMessages: {
      en: `Loading ${screenType} screen...`,
      uz: `${screenType === 'student' ? 'O\'quvchi' : 'O\'qituvchi'} ekrani yuklanmoqda...`,
      ru: `Загрузка экрана ${screenType === 'student' ? 'ученика' : 'учителя'}...`,
      ar: `...جاري تحميل شاشة ${screenType === 'student' ? 'الطالب' : 'المعلم'}`,
    },
  };

  return createLazyScreen(importFunction, config);
};

// Preload utility for critical screens
export const preloadScreens = (
  importFunctions: Array<() => Promise<{ default: ComponentType<any> }>>
): void => {
  importFunctions.forEach((importFn, index) => {
    setTimeout(() => {
      importFn().catch(error => {
        console.warn(`Failed to preload screen ${index}:`, error);
      });
    }, index * 100); // Stagger preloading
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    width: screenWidth * 0.6,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '400',
  },
  skeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  skeletonHeader: {
    height: 60,
    borderRadius: 8,
    marginBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineSmall: {
    height: 12,
    borderRadius: 6,
    width: '70%',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: -screenWidth,
    width: screenWidth * 2,
    height: '100%',
  },
  islamicPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default createLazyScreen;