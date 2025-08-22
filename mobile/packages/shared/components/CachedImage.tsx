import React, { useState, useEffect, memo } from 'react';
import {
  Image,
  ImageStyle,
  View,
  ViewStyle,
  ActivityIndicator,
  Text,
  StyleSheet,
  ImageErrorEventData,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Rect, ImageSVG, Skia } from '@shopify/react-native-skia';
import ImageCacheManager from '../utils/ImageCache';

export interface CachedImageProps {
  source: string | { uri: string };
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  fadeDuration?: number;
  retryCount?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
  onLoadStart?: () => void;
  priority?: 'low' | 'normal' | 'high';
  preload?: boolean;
  enableBlur?: boolean;
  blurRadius?: number;
  enableSkeleton?: boolean;
  skeletonColors?: string[];
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  accessibilityLabel?: string;
  testID?: string;
}

interface ImageState {
  loading: boolean;
  error: boolean;
  loaded: boolean;
  cachedUri?: string;
  retryAttempts: number;
}

const CachedImage: React.FC<CachedImageProps> = memo(({
  source,
  style,
  containerStyle,
  placeholder,
  errorComponent,
  loadingComponent,
  fadeDuration = 300,
  retryCount = 3,
  resizeMode = 'cover',
  onLoad,
  onError,
  onLoadStart,
  priority = 'normal',
  preload = false,
  enableBlur = false,
  blurRadius = 5,
  enableSkeleton = true,
  skeletonColors = ['#E1E9EE', '#F2F8FC'],
  culturalTheme = 'modern',
  accessibilityLabel,
  testID,
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    loading: true,
    error: false,
    loaded: false,
    retryAttempts: 0,
  });

  const imageOpacity = useSharedValue(0);
  const skeletonAnimation = useSharedValue(0);
  const errorShake = useSharedValue(0);

  const imageUri = typeof source === 'string' ? source : source?.uri;
  const cacheManager = ImageCacheManager.getInstance();

  // Cultural theme colors
  const getCulturalColors = () => {
    switch (culturalTheme) {
      case 'islamic':
        return {
          primary: '#1d7452',
          secondary: '#22c55e',
          accent: '#dcfce7',
          skeleton: ['#E8F5E8', '#F0F9F0'],
        };
      case 'educational':
        return {
          primary: '#2563eb',
          secondary: '#3b82f6',
          accent: '#dbeafe',
          skeleton: ['#E0E7FF', '#F0F4FF'],
        };
      case 'modern':
      default:
        return {
          primary: '#6b7280',
          secondary: '#9ca3af',
          accent: '#f3f4f6',
          skeleton: ['#E1E9EE', '#F2F8FC'],
        };
    }
  };

  const colors = getCulturalColors();

  // Start skeleton animation
  useEffect(() => {
    if (imageState.loading && enableSkeleton) {
      skeletonAnimation.value = withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      );
      
      const interval = setInterval(() => {
        skeletonAnimation.value = withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [imageState.loading, enableSkeleton]);

  // Load cached image
  useEffect(() => {
    if (!imageUri) {
      setImageState(prev => ({ ...prev, loading: false, error: true }));
      return;
    }

    const loadImage = async () => {
      try {
        setImageState(prev => ({ ...prev, loading: true, error: false }));
        onLoadStart?.();

        // Get cached URI
        const cachedUri = await cacheManager.getCachedImageURI(imageUri);
        
        setImageState(prev => ({
          ...prev,
          cachedUri,
          loading: false,
          loaded: true,
        }));
      } catch (error) {
        console.error('Failed to load cached image:', error);
        setImageState(prev => ({
          ...prev,
          loading: false,
          error: true,
          retryAttempts: prev.retryAttempts + 1,
        }));
      }
    };

    loadImage();
  }, [imageUri, imageState.retryAttempts]);

  // Preload image if requested
  useEffect(() => {
    if (preload && imageUri && priority === 'high') {
      cacheManager.preloadImages([imageUri]);
    }
  }, [preload, imageUri, priority]);

  // Handle image load success
  const handleImageLoad = () => {
    imageOpacity.value = withTiming(1, {
      duration: fadeDuration,
      easing: Easing.out(Easing.cubic),
    });
    
    setImageState(prev => ({ ...prev, loaded: true }));
    onLoad?.();
  };

  // Handle image load error
  const handleImageError = (error: NativeSyntheticEvent<ImageErrorEventData>) => {
    // Shake animation for error
    errorShake.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    if (imageState.retryAttempts < retryCount) {
      // Retry loading
      setTimeout(() => {
        setImageState(prev => ({
          ...prev,
          retryAttempts: prev.retryAttempts + 1,
          error: false,
        }));
      }, 1000 * Math.pow(2, imageState.retryAttempts)); // Exponential backoff
    } else {
      setImageState(prev => ({ ...prev, error: true }));
    }

    onError?.(error);
  };

  // Animated styles
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    if (!enableSkeleton) return {};
    
    return {
      opacity: interpolate(skeletonAnimation.value, [0, 1], [0.3, 0.7]),
    };
  });

  // Render skeleton loader
  const renderSkeleton = () => {
    if (!enableSkeleton || !imageState.loading) return null;

    return (
      <Animated.View style={[StyleSheet.absoluteFillObject, skeletonAnimatedStyle]}>
        <Canvas style={StyleSheet.absoluteFillObject}>
          <Rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            color={colors.skeleton[0]}
          />
        </Canvas>
      </Animated.View>
    );
  };

  // Render loading component
  const renderLoading = () => {
    if (!imageState.loading) return null;

    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="small" 
          color={colors.primary}
          testID={`${testID}-loading`}
        />
      </View>
    );
  };

  // Render error component
  const renderError = () => {
    if (!imageState.error) return null;

    if (errorComponent) {
      return errorComponent;
    }

    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.accent }]}>
        <Text style={[styles.errorText, { color: colors.primary }]}>
          Failed to load image
        </Text>
        {imageState.retryAttempts < retryCount && (
          <ActivityIndicator 
            size="small" 
            color={colors.secondary} 
            style={styles.retryIndicator}
          />
        )}
      </View>
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <View style={[styles.placeholderContainer, { backgroundColor: colors.accent }]}>
        <Canvas style={styles.placeholderIcon}>
          <Rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            color={colors.skeleton[0]}
            rx={4}
          />
        </Canvas>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[styles.container, containerStyle, containerAnimatedStyle]}
      testID={testID}
    >
      {/* Placeholder/Skeleton */}
      {imageState.loading && (
        <>
          {renderPlaceholder()}
          {renderSkeleton()}
        </>
      )}

      {/* Actual Image */}
      {imageState.cachedUri && !imageState.error && (
        <Animated.View style={[StyleSheet.absoluteFillObject, imageAnimatedStyle]}>
          <Image
            source={{ uri: imageState.cachedUri }}
            style={[StyleSheet.absoluteFillObject, style]}
            resizeMode={resizeMode}
            onLoad={handleImageLoad}
            onError={handleImageError}
            blurRadius={enableBlur ? blurRadius : undefined}
            accessibilityLabel={accessibilityLabel}
            testID={`${testID}-image`}
          />
        </Animated.View>
      )}

      {/* Loading Indicator */}
      {renderLoading()}

      {/* Error Component */}
      {renderError()}
    </Animated.View>
  );
});

CachedImage.displayName = 'CachedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryIndicator: {
    marginTop: 4,
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: '60%',
    height: '60%',
  },
});

export default CachedImage;