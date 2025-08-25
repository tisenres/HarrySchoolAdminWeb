import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Group, RoundedRect, LinearGradient, vec, Path } from '@shopify/react-native-skia';
import { Haptics } from 'expo-haptics';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated as ReanimatedGH, { 
  useAnimatedGestureHandler,
  useAnimatedProps,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export interface FlashcardContent {
  id: string;
  front: {
    text: string;
    language: 'en' | 'uz' | 'ru' | 'ar';
    pronunciation?: string;
    image?: string;
  };
  back: {
    text: string;
    language: 'en' | 'uz' | 'ru' | 'ar';
    pronunciation?: string;
    translation?: string;
    example?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'vocabulary' | 'grammar' | 'math' | 'science';
}

export interface FlashcardFlipProps {
  content: FlashcardContent;
  width?: number;
  height?: number;
  culturalTheme: 'islamic_green' | 'traditional_blue' | 'warm_gold' | 'neutral_gray';
  onFlip?: (side: 'front' | 'back') => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  autoFlip?: boolean;
  autoFlipDelay?: number;
  respectPrayerTime?: boolean;
  age: 'elementary' | 'middle' | 'high';
  enableGestures?: boolean;
}

export const FlashcardFlip: React.FC<FlashcardFlipProps> = ({
  content,
  width = screenWidth * 0.85,
  height = 200,
  culturalTheme,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  autoFlip = false,
  autoFlipDelay = 3000,
  respectPrayerTime = true,
  age,
  enableGestures = true,
}) => {
  const flipValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const translateX = useSharedValue(0);
  const gestureActive = useSharedValue(false);
  const currentSide = useRef<'front' | 'back'>('front');
  const autoFlipTimeout = useRef<NodeJS.Timeout>();

  // Cultural color themes
  const colorThemes = {
    islamic_green: {
      front: {
        background: ['#1D7452', '#2ECC71'],
        text: '#FFFFFF',
        accent: '#F1C40F',
        border: '#27AE60',
      },
      back: {
        background: ['#27AE60', '#2ECC71'],
        text: '#FFFFFF',
        accent: '#F39C12',
        border: '#1D7452',
      },
    },
    traditional_blue: {
      front: {
        background: ['#2980B9', '#3498DB'],
        text: '#FFFFFF',
        accent: '#ECF0F1',
        border: '#21618C',
      },
      back: {
        background: ['#3498DB', '#5DADE2'],
        text: '#FFFFFF',
        accent: '#F8F9FA',
        border: '#2980B9',
      },
    },
    warm_gold: {
      front: {
        background: ['#D68910', '#F1C40F'],
        text: '#2C3E50',
        accent: '#FFFFFF',
        border: '#B7950B',
      },
      back: {
        background: ['#F1C40F', '#F7DC6F'],
        text: '#2C3E50',
        accent: '#FFFFFF',
        border: '#D68910',
      },
    },
    neutral_gray: {
      front: {
        background: ['#5D6D7E', '#85929E'],
        text: '#FFFFFF',
        accent: '#D5DBDB',
        border: '#4A5568',
      },
      back: {
        background: ['#85929E', '#AEB6BF'],
        text: '#2C3E50',
        accent: '#FFFFFF',
        border: '#5D6D7E',
      },
    },
  };

  // Age-specific configurations
  const ageConfigurations = {
    elementary: {
      fontSize: { main: 18, secondary: 14, small: 12 },
      animationDuration: 600,
      cornerRadius: 20,
      shadowStrength: 0.3,
    },
    middle: {
      fontSize: { main: 16, secondary: 12, small: 10 },
      animationDuration: 500,
      cornerRadius: 16,
      shadowStrength: 0.25,
    },
    high: {
      fontSize: { main: 14, secondary: 11, small: 9 },
      animationDuration: 400,
      cornerRadius: 12,
      shadowStrength: 0.2,
    },
  };

  const theme = colorThemes[culturalTheme];
  const config = ageConfigurations[age];

  const createIslamicPattern = (width: number, height: number): string => {
    // Simple geometric pattern for card decoration
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.1;
    
    let path = '';
    const points = 8;
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    path += ' Z';
    
    return path;
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'success' = 'light') => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    }
  };

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    
    // Simplified prayer times
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const flipCard = (toSide?: 'front' | 'back') => {
    const targetValue = toSide === 'back' || (toSide === undefined && currentSide.current === 'front') ? 1 : 0;
    const newSide = targetValue === 1 ? 'back' : 'front';
    
    triggerHapticFeedback('light');
    
    const isPrayerTime = checkPrayerTimeRestriction();
    const duration = isPrayerTime ? config.animationDuration * 1.3 : config.animationDuration;
    
    flipValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    }, (finished) => {
      if (finished) {
        currentSide.current = newSide;
        runOnJS(onFlip)?.(newSide);
      }
    });

    // Add subtle scale animation
    scaleValue.value = withTiming(0.95, {
      duration: duration / 2,
    }, () => {
      scaleValue.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    });
  };

  const setupAutoFlip = () => {
    if (autoFlip && !checkPrayerTimeRestriction()) {
      autoFlipTimeout.current = setTimeout(() => {
        flipCard('back');
        // Flip back after another delay
        setTimeout(() => {
          flipCard('front');
          setupAutoFlip(); // Recursive auto-flip
        }, autoFlipDelay);
      }, autoFlipDelay);
    }
  };

  const clearAutoFlip = () => {
    if (autoFlipTimeout.current) {
      clearTimeout(autoFlipTimeout.current);
      autoFlipTimeout.current = undefined;
    }
  };

  useEffect(() => {
    if (autoFlip) {
      setupAutoFlip();
    }
    
    return () => {
      clearAutoFlip();
    };
  }, [autoFlip, autoFlipDelay]);

  // Gesture handler for swipe actions
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      if (!enableGestures) return;
      context.startX = translateX.value;
      gestureActive.value = true;
      scaleValue.value = withSpring(0.95);
    },
    onActive: (event, context) => {
      if (!enableGestures) return;
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      if (!enableGestures) return;
      gestureActive.value = false;
      scaleValue.value = withSpring(1);

      const threshold = width * 0.3;
      
      if (event.translationX > threshold && onSwipeRight) {
        // Swipe right - mark as known/correct
        translateX.value = withTiming(width * 1.2, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }, () => {
          translateX.value = 0;
          runOnJS(triggerHapticFeedback)('success');
          runOnJS(onSwipeRight)();
        });
      } else if (event.translationX < -threshold && onSwipeLeft) {
        // Swipe left - mark as unknown/incorrect
        translateX.value = withTiming(-width * 1.2, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }, () => {
          translateX.value = 0;
          runOnJS(triggerHapticFeedback)('medium');
          runOnJS(onSwipeLeft)();
        });
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    },
  });

  // Animated styles
  const frontCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipValue.value, [0, 0.5, 1], [1, 0, 0]);
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scaleValue.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  const backCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [-180, 0]);
    const opacity = interpolate(flipValue.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scaleValue.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scaleValue.value,
      [0.95, 1],
      [config.shadowStrength, config.shadowStrength * 0.7]
    );
    
    return {
      shadowOpacity,
      elevation: gestureActive.value ? 8 : 4,
    };
  });

  const renderCardContent = (side: 'front' | 'back') => {
    const cardContent = content[side];
    const cardTheme = theme[side];
    const isArabic = cardContent.language === 'ar';
    
    return (
      <View style={[styles.cardContent, { 
        width, 
        height,
        backgroundColor: 'transparent',
      }]}>
        {/* Cultural pattern overlay */}
        <Canvas style={StyleSheet.absoluteFill}>
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={config.cornerRadius}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={cardTheme.background}
            />
          </RoundedRect>
          
          {/* Decorative pattern */}
          <Group opacity={0.1}>
            <Path
              path={createIslamicPattern(width, height)}
              color={cardTheme.accent}
              style="fill"
            />
          </Group>
        </Canvas>

        {/* Text content */}
        <View style={[styles.textContainer, {
          paddingHorizontal: 20,
          paddingVertical: 16,
        }]}>
          {/* Main text */}
          <Text style={[
            styles.mainText,
            {
              color: cardTheme.text,
              fontSize: config.fontSize.main,
              textAlign: isArabic ? 'right' : 'left',
              writingDirection: isArabic ? 'rtl' : 'ltr',
            }
          ]}>
            {cardContent.text}
          </Text>

          {/* Pronunciation guide */}
          {cardContent.pronunciation && (
            <Text style={[
              styles.pronunciationText,
              {
                color: cardTheme.accent,
                fontSize: config.fontSize.secondary,
                textAlign: isArabic ? 'right' : 'left',
              }
            ]}>
              [{cardContent.pronunciation}]
            </Text>
          )}

          {/* Back-specific content */}
          {side === 'back' && (
            <>
              {content.back.translation && (
                <Text style={[
                  styles.translationText,
                  {
                    color: cardTheme.text,
                    fontSize: config.fontSize.secondary,
                    opacity: 0.9,
                  }
                ]}>
                  {content.back.translation}
                </Text>
              )}
              
              {content.back.example && (
                <Text style={[
                  styles.exampleText,
                  {
                    color: cardTheme.accent,
                    fontSize: config.fontSize.small,
                    fontStyle: 'italic',
                  }
                ]}>
                  {content.back.example}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Difficulty indicator */}
        <View style={[styles.difficultyIndicator, {
          backgroundColor: content.difficulty === 'easy' ? '#2ECC71' : 
                         content.difficulty === 'medium' ? '#F39C12' : '#E74C3C',
        }]}>
          <Text style={styles.difficultyText}>
            {content.difficulty.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.View style={[styles.cardShadow, shadowStyle]}>
        <PanGestureHandler onGestureEvent={gestureHandler} enabled={enableGestures}>
          <ReanimatedGH.View style={styles.gestureContainer}>
            <Pressable onPress={() => flipCard()} activeOpacity={0.9}>
              {/* Front card */}
              <Animated.View style={[styles.card, frontCardStyle]}>
                {renderCardContent('front')}
              </Animated.View>

              {/* Back card */}
              <Animated.View style={[styles.card, styles.backCard, backCardStyle]}>
                {renderCardContent('back')}
              </Animated.View>
            </Pressable>
          </ReanimatedGH.View>
        </PanGestureHandler>
      </Animated.View>

      {/* Gesture hints */}
      {enableGestures && (
        <View style={styles.gestureHints}>
          <Text style={styles.hintText}>← Don't know</Text>
          <Text style={styles.hintText}>Know →</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 4,
  },
  gestureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  backCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardContent: {
    justifyContent: 'center',
    position: 'relative',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  mainText: {
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  pronunciationText: {
    fontWeight: '500',
    marginBottom: 8,
  },
  translationText: {
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    marginTop: 4,
    lineHeight: 18,
  },
  difficultyIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gestureHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
});

export default FlashcardFlip;