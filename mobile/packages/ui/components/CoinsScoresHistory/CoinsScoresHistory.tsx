/**
 * CoinsScoresHistory Component
 * Harry School Mobile Design System
 * 
 * Achievement history list with animations and gamification elements
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { CoinsScoresHistoryProps, HistoryItem, HistoryType } from './CoinsScoresHistory.types';

// Individual history item component
const HistoryItemComponent: React.FC<{
  item: HistoryItem;
  index: number;
  theme: 'light' | 'dark';
  enableHaptics: boolean;
}> = ({ item, index, theme, enableHaptics }) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
  }), [theme, tokens]);
  
  // Entry animation
  React.useEffect(() => {
    opacity.value = withDelay(
      index * 100,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    scale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [index, opacity, scale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        scale: interpolate(
          scale.value,
          [0, 1],
          [0.9, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  
  const getTypeConfig = (type: HistoryType) => {
    switch (type) {
      case 'coins_earned':
        return { icon: '🪙', color: '#fbbf24', prefix: '+' };
      case 'coins_spent':
        return { icon: '🪙', color: '#ef4444', prefix: '-' };
      case 'points_earned':
        return { icon: '⭐', color: '#8b5cf6', prefix: '+' };
      case 'level_up':
        return { icon: '🎉', color: '#10b981', prefix: '' };
      case 'achievement':
        return { icon: '🏆', color: '#f59e0b', prefix: '' };
      case 'streak':
        return { icon: '🔥', color: '#ef4444', prefix: '' };
      default:
        return { icon: '📈', color: '#6b7280', prefix: '+' };
    }
  };
  
  const config = getTypeConfig(item.type);
  
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        },
        animatedStyle,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Text style={[styles.icon, { color: config.color }]}>
          {config.icon}
        </Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            {item.description}
          </Text>
        )}
        <Text style={[styles.date, { color: themeColors.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      
      {/* Value */}
      {item.value !== undefined && (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: config.color }]}>
            {config.prefix}{formatValue(item.value)}
          </Text>
          {item.unit && (
            <Text style={[styles.unit, { color: themeColors.textSecondary }]}>
              {item.unit}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

export const CoinsScoresHistory: React.FC<CoinsScoresHistoryProps> = ({
  items,
  title,
  subtitle,
  filterType,
  showEmpty = true,
  enableHaptics = true,
  theme = 'dark',
  style,
  testID = 'coins-scores-history',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
  }), [theme, tokens]);
  
  // Filter items by type if specified
  const filteredItems = useMemo(() => {
    if (!filterType) return items;
    return items.filter(item => item.type === filterType);
  }, [items, filterType]);
  
  // Sort items by date (newest first)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredItems]);
  
  const renderItem = useCallback(({ item, index }: { item: HistoryItem; index: number }) => (
    <HistoryItemComponent
      item={item}
      index={index}
      theme={theme}
      enableHaptics={enableHaptics}
    />
  ), [theme, enableHaptics]);
  
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <View style={styles.header}>
        {title && (
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };
  
  const renderEmpty = () => {
    if (!showEmpty) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          No activity yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
          Your achievements and progress will appear here
        </Text>
      </View>
    );
  };
  
  const keyExtractor = useCallback((item: HistoryItem, index: number) => 
    item.id || `${item.type}-${index}`, []);
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
        style,
      ]}
      testID={testID}
    >
      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  itemContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end' as const,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
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

CoinsScoresHistory.displayName = 'CoinsScoresHistory';

export default CoinsScoresHistory;