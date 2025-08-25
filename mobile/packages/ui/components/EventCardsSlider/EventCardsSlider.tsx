/**
 * EventCardsSlider Component
 * Harry School Mobile Design System
 * 
 * Horizontal scrolling container for EventCard components
 * Optimized for performance and smooth scrolling
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { EventCardsSliderProps, EventData, ScrollIndicatorProps } from './EventCardsSlider.types';
import EventCard from '../EventCard/EventCard';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scroll indicator component
const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  totalItems,
  currentIndex,
  indicatorColor = '#fbbf24',
  inactiveColor = '#4a4a4a',
  theme = 'dark',
}) => {
  if (totalItems <= 1) return null;
  
  return (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: totalItems }, (_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor: index === currentIndex ? indicatorColor : inactiveColor,
              opacity: index === currentIndex ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
};

export const EventCardsSlider: React.FC<EventCardsSliderProps> = ({
  events,
  title,
  subtitle,
  cardSize = 'default',
  cardTheme = 'dark',
  showScrollIndicator = true,
  showGoldenBorders = false,
  snapToInterval = true,
  enableHaptics = true,
  contentPadding = 20,
  cardSpacing = 16,
  onEventPress,
  onEventLongPress,
  onScrollEnd,
  emptyState,
  theme = 'dark',
  style,
  testID = 'event-cards-slider',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    accent: '#1d7452', // Harry School green
    gold: '#fbbf24', // Golden accents
  }), [theme, tokens]);
  
  // Card size configuration
  const sizeConfig = useMemo(() => ({
    compact: { width: 160, height: 120 },
    default: { width: 200, height: 140 },
    large: { width: 240, height: 160 },
  }), []);
  
  const cardConfig = sizeConfig[cardSize];
  const snapInterval = snapToInterval ? cardConfig.width + cardSpacing : undefined;
  
  // Haptic feedback handler
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  // Update current index based on scroll position
  const updateCurrentIndex = useCallback((scrollPosition: number) => {
    const newIndex = Math.round(scrollPosition / (cardConfig.width + cardSpacing));
    const clampedIndex = Math.max(0, Math.min(newIndex, events.length - 1));
    
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
      triggerHaptic();
    }
  }, [cardConfig.width, cardSpacing, events.length, currentIndex, triggerHaptic]);
  
  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      
      if (snapToInterval) {
        runOnJS(updateCurrentIndex)(event.contentOffset.x);
      }
    },
    onEndDrag: (event) => {
      if (onScrollEnd) {
        const index = Math.round(event.contentOffset.x / (cardConfig.width + cardSpacing));
        runOnJS(onScrollEnd)(Math.max(0, Math.min(index, events.length - 1)));
      }
    },
  });
  
  // Event press handlers
  const handleEventPress = useCallback((event: EventData, index: number) => {
    triggerHaptic();
    onEventPress?.(event, index);
  }, [triggerHaptic, onEventPress]);
  
  const handleEventLongPress = useCallback((event: EventData, index: number) => {
    if (Platform.OS === 'ios' && enableHaptics) {
      HapticFeedback.trigger('medium');
    }
    onEventLongPress?.(event, index);
  }, [enableHaptics, onEventLongPress]);
  
  // Render individual event card
  const renderEventCard = useCallback((event: EventData, index: number) => {
    return (
      <EventCard
        key={`${event.id}-${index}`}
        title={event.title}
        subtitle={event.subtitle}
        time={event.time}
        duration={event.duration}
        status={event.status}
        type={event.type}
        color={event.color}
        image={event.image}
        icon={event.icon}
        progress={event.progress}
        attendees={event.attendees}
        location={event.location}
        description={event.description}
        priority={event.priority}
        isLive={event.isLive}
        hasNotification={event.hasNotification}
        onPress={() => handleEventPress(event, index)}
        onLongPress={() => handleEventLongPress(event, index)}
        enableHaptics={enableHaptics}
        showGoldenBorder={showGoldenBorders && (event.isLive || event.priority === 'high')}
        theme={cardTheme}
        size={cardSize}
        style={{
          marginRight: index === events.length - 1 ? contentPadding : cardSpacing,
        }}
        testID={`${testID}-card-${index}`}
      />
    );
  }, [
    handleEventPress,
    handleEventLongPress,
    enableHaptics,
    showGoldenBorders,
    cardTheme,
    cardSize,
    contentPadding,
    cardSpacing,
    events.length,
    testID,
  ]);
  
  // Render header
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
        {title && (
          <Text style={[styles.title, { color: themeColors.text }]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (events.length > 0) return null;
    
    const defaultEmptyState = (
      <View style={[styles.emptyContainer, { paddingHorizontal: contentPadding }]}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          No events scheduled
        </Text>
        <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
          Your upcoming events will appear here
        </Text>
      </View>
    );
    
    return emptyState || defaultEmptyState;
  };
  
  // Get content container style with proper padding
  const getContentContainerStyle = () => ({
    paddingLeft: contentPadding,
    paddingRight: events.length > 0 ? 0 : contentPadding,
    alignItems: 'center' as const,
  });
  
  if (events.length === 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {renderHeader()}
        {renderEmptyState()}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]} testID={testID}>
      {renderHeader()}
      
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate={snapToInterval ? 0.9 : 'normal'}
        contentContainerStyle={getContentContainerStyle()}
        style={styles.scrollView}
        testID={`${testID}-scroll-view`}
      >
        {events.map(renderEventCard)}
      </AnimatedScrollView>
      
      {showScrollIndicator && (
        <ScrollIndicator
          totalItems={events.length}
          currentIndex={currentIndex}
          indicatorColor={themeColors.gold}
          inactiveColor={theme === 'dark' ? '#4a4a4a' : '#d0d5dd'}
          theme={theme}
        />
      )}
    </View>
  );
};

const styles = {
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  scrollView: {
    flexGrow: 0,
  },
  indicatorContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
};

EventCardsSlider.displayName = 'EventCardsSlider';

export default EventCardsSlider;