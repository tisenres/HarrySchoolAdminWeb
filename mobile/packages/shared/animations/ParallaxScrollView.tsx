import React, { ReactNode, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useScrollViewAnimatedProps,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Canvas, Group, Circle, Path, LinearGradient, RadialGradient, vec } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export interface ParallaxLayer {
  id: string;
  component: ReactNode;
  speed: number; // 0-1, where 0 is static and 1 follows scroll exactly
  zIndex?: number;
  opacity?: number;
  scale?: number;
  culturalPattern?: 'islamic_stars' | 'geometric_tiles' | 'calligraphy_flow' | 'traditional_waves';
}

export interface ParallaxScrollViewProps {
  children: ReactNode;
  headerHeight?: number;
  backgroundLayers?: ParallaxLayer[];
  foregroundLayers?: ParallaxLayer[];
  culturalTheme: 'islamic_green' | 'academic_blue' | 'warm_sand' | 'neutral_modern';
  enableCulturalPatterns?: boolean;
  respectPrayerTime?: boolean;
  age: 'elementary' | 'middle' | 'high';
  showProgressIndicator?: boolean;
  onScroll?: (scrollY: number) => void;
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerHeight = 300,
  backgroundLayers = [],
  foregroundLayers = [],
  culturalTheme,
  enableCulturalPatterns = true,
  respectPrayerTime = true,
  age,
  showProgressIndicator = true,
  onScroll,
}) => {
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Cultural color palettes
  const culturalPalettes = {
    islamic_green: {
      primary: '#1D7452',
      secondary: '#2ECC71',
      accent: '#F1C40F',
      background: '#E8F5E8',
      overlay: 'rgba(29, 116, 82, 0.1)',
    },
    academic_blue: {
      primary: '#2C3E50',
      secondary: '#3498DB',
      accent: '#9B59B6',
      background: '#ECF0F1',
      overlay: 'rgba(44, 62, 80, 0.1)',
    },
    warm_sand: {
      primary: '#D68910',
      secondary: '#F39C12',
      accent: '#E67E22',
      background: '#FEF9E7',
      overlay: 'rgba(214, 137, 16, 0.1)',
    },
    neutral_modern: {
      primary: '#5D6D7E',
      secondary: '#85929E',
      accent: '#AEB6BF',
      background: '#F8F9FA',
      overlay: 'rgba(93, 109, 126, 0.1)',
    },
  };

  // Age-specific configurations
  const ageConfigurations = {
    elementary: {
      parallaxIntensity: 0.8,
      patternSize: 'large',
      animationDuration: 800,
      scrollIndicatorSize: 6,
    },
    middle: {
      parallaxIntensity: 0.6,
      patternSize: 'medium',
      animationDuration: 600,
      scrollIndicatorSize: 4,
    },
    high: {
      parallaxIntensity: 0.4,
      patternSize: 'small',
      animationDuration: 400,
      scrollIndicatorSize: 3,
    },
  };

  const palette = culturalPalettes[culturalTheme];
  const config = ageConfigurations[age];

  const createIslamicStarPattern = (size: 'small' | 'medium' | 'large'): string => {
    const baseSize = size === 'small' ? 20 : size === 'medium' ? 30 : 40;
    const points = 8;
    const outerRadius = baseSize * 0.5;
    const innerRadius = baseSize * 0.3;
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    path += ' Z';
    return path;
  };

  const createGeometricTilePattern = (size: 'small' | 'medium' | 'large'): string => {
    const tileSize = size === 'small' ? 15 : size === 'medium' ? 25 : 35;
    const points = 6;
    const radius = tileSize * 0.5;
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    return path;
  };

  const createTraditionalWaves = (width: number, amplitude: number): string => {
    const frequency = 4;
    let path = `M 0 ${amplitude}`;
    
    for (let x = 0; x <= width; x += 2) {
      const y = amplitude + Math.sin((x * frequency * Math.PI) / width) * (amplitude * 0.3);
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${width} ${amplitude * 2} L 0 ${amplitude * 2} Z`;
    return path;
  };

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const getParallaxSpeed = (baseSpeed: number): number => {
    const isPrayerTime = checkPrayerTimeRestriction();
    const intensityMultiplier = isPrayerTime ? 0.7 : 1;
    return baseSpeed * config.parallaxIntensity * intensityMultiplier;
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (onScroll) {
        onScroll(event.contentOffset.y);
      }
    },
  });

  // Background cultural patterns
  const backgroundPatternStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight * 0.3],
      Extrapolation.EXTEND
    );

    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.5, headerHeight],
      [0.6, 0.3, 0.1],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, headerHeight],
      [1, 1.2],
      Extrapolation.EXTEND
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  // Header gradient overlay
  const headerOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.7, headerHeight],
      [0, 0.5, 0.8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Progress indicator
  const progressIndicatorStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, 1],
      Extrapolation.CLAMP
    );

    const backgroundColor = interpolateColor(
      progress,
      [0, 1],
      [palette.accent, palette.primary]
    );

    return {
      width: `${progress * 100}%`,
      backgroundColor,
    };
  });

  // Render background layers
  const renderBackgroundLayers = () => {
    return backgroundLayers.map((layer, index) => {
      const layerStyle = useAnimatedStyle(() => {
        const speed = getParallaxSpeed(layer.speed);
        const translateY = interpolate(
          scrollY.value,
          [0, headerHeight],
          [0, -headerHeight * speed],
          Extrapolation.EXTEND
        );

        return {
          transform: [{ translateY }],
          zIndex: layer.zIndex || -index,
          opacity: layer.opacity || 1,
        };
      });

      return (
        <Animated.View key={layer.id} style={[StyleSheet.absoluteFill, layerStyle]}>
          {layer.component}
        </Animated.View>
      );
    });
  };

  // Render foreground layers
  const renderForegroundLayers = () => {
    return foregroundLayers.map((layer, index) => {
      const layerStyle = useAnimatedStyle(() => {
        const speed = getParallaxSpeed(layer.speed);
        const translateY = interpolate(
          scrollY.value,
          [0, headerHeight],
          [0, -headerHeight * speed],
          Extrapolation.EXTEND
        );

        return {
          transform: [{ translateY }],
          zIndex: layer.zIndex || 100 + index,
          opacity: layer.opacity || 1,
        };
      });

      return (
        <Animated.View key={layer.id} style={[StyleSheet.absoluteFill, layerStyle]}>
          {layer.component}
        </Animated.View>
      );
    });
  };

  // Render cultural patterns
  const renderCulturalPatterns = () => {
    if (!enableCulturalPatterns) return null;

    return (
      <Animated.View style={[StyleSheet.absoluteFill, backgroundPatternStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Background gradient */}
          <Group>
            <Circle cx={screenWidth / 2} cy={headerHeight / 2} r={headerHeight}>
              <RadialGradient
                c={vec(screenWidth / 2, headerHeight / 2)}
                r={headerHeight}
                colors={[palette.background, 'transparent']}
              />
            </Circle>
          </Group>

          {/* Cultural patterns */}
          <Group opacity={0.3}>
            {/* Islamic stars pattern */}
            {culturalTheme === 'islamic_green' && (
              <>
                {Array.from({ length: 12 }, (_, i) => (
                  <Group
                    key={`star-${i}`}
                    transform={[
                      { 
                        translateX: (i % 4) * (screenWidth / 3) + 50 
                      },
                      { 
                        translateY: Math.floor(i / 4) * (headerHeight / 3) + 50 
                      },
                    ]}
                  >
                    <Path
                      path={createIslamicStarPattern(config.patternSize)}
                      color={palette.primary}
                      style="fill"
                      opacity={0.4}
                    />
                  </Group>
                ))}
              </>
            )}

            {/* Geometric tiles pattern */}
            {culturalTheme === 'academic_blue' && (
              <>
                {Array.from({ length: 16 }, (_, i) => (
                  <Group
                    key={`tile-${i}`}
                    transform={[
                      { 
                        translateX: (i % 4) * (screenWidth / 4) + 30 
                      },
                      { 
                        translateY: Math.floor(i / 4) * (headerHeight / 4) + 30 
                      },
                    ]}
                  >
                    <Path
                      path={createGeometricTilePattern(config.patternSize)}
                      color={palette.secondary}
                      style="fill"
                      opacity={0.3}
                    />
                  </Group>
                ))}
              </>
            )}

            {/* Traditional waves */}
            {(culturalTheme === 'warm_sand' || culturalTheme === 'neutral_modern') && (
              <>
                {Array.from({ length: 5 }, (_, i) => (
                  <Group
                    key={`wave-${i}`}
                    transform={[
                      { translateY: i * (headerHeight / 6) + 40 }
                    ]}
                  >
                    <Path
                      path={createTraditionalWaves(screenWidth, 30)}
                      color={palette.accent}
                      style="fill"
                      opacity={0.2}
                    />
                  </Group>
                ))}
              </>
            )}
          </Group>
        </Canvas>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background cultural patterns */}
      {renderCulturalPatterns()}

      {/* Background layers */}
      {renderBackgroundLayers()}

      {/* Header overlay */}
      <Animated.View style={[styles.headerOverlay, headerOverlayStyle]} />

      {/* Scroll view */}
      <AnimatedScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight }
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </AnimatedScrollView>

      {/* Foreground layers */}
      {renderForegroundLayers()}

      {/* Progress indicator */}
      {showProgressIndicator && (
        <View style={[styles.progressContainer, { top: insets.top }]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressIndicatorStyle]} />
          </View>
        </View>
      )}

      {/* Status bar */}
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'} 
        backgroundColor={palette.primary} 
        translucent={Platform.OS === 'android'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 50,
  },
  progressContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1000,
  },
  progressTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
  },
});

// Specialized parallax components
export const StudentDashboardParallax: React.FC<{
  children: ReactNode;
  studentLevel: number;
  achievements: number;
  age: 'elementary' | 'middle' | 'high';
}> = ({ children, studentLevel, achievements, age }) => {
  const backgroundLayers: ParallaxLayer[] = [
    {
      id: 'stars-bg',
      component: (
        <View style={{ flex: 1, backgroundColor: '#1D7452' }} />
      ),
      speed: 0.2,
    },
    {
      id: 'achievements-float',
      component: (
        <View style={styles.achievementsBg}>
          {Array.from({ length: Math.min(achievements, 20) }, (_, i) => (
            <View
              key={i}
              style={[
                styles.achievementStar,
                {
                  left: `${(i * 47) % 100}%`,
                  top: `${(i * 23) % 100}%`,
                },
              ]}
            />
          ))}
        </View>
      ),
      speed: 0.5,
    },
  ];

  return (
    <ParallaxScrollView
      backgroundLayers={backgroundLayers}
      culturalTheme="islamic_green"
      age={age}
      headerHeight={250}
    >
      {children}
    </ParallaxScrollView>
  );
};

export const LessonParallax: React.FC<{
  children: ReactNode;
  subject: 'math' | 'science' | 'language' | 'islamic_studies';
  age: 'elementary' | 'middle' | 'high';
}> = ({ children, subject, age }) => {
  const getSubjectTheme = () => {
    switch (subject) {
      case 'math': return 'academic_blue';
      case 'science': return 'neutral_modern';
      case 'language': return 'warm_sand';
      case 'islamic_studies': return 'islamic_green';
      default: return 'academic_blue';
    }
  };

  return (
    <ParallaxScrollView
      culturalTheme={getSubjectTheme()}
      age={age}
      headerHeight={200}
      enableCulturalPatterns={true}
    >
      {children}
    </ParallaxScrollView>
  );
};

const achievementStyles = StyleSheet.create({
  achievementsBg: {
    flex: 1,
    position: 'relative',
  },
  achievementStar: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#F1C40F',
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
  },
});

export default ParallaxScrollView;