/**
 * RankingList Component
 * Harry School Mobile Design System
 * 
 * Complete ranking component with header, filters, and animated list
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { RankingListProps, RankingData, RankingFilter, RankingPeriod } from './RankingList.types';
import RankingListItem from '../RankingListItem/RankingListItem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Filter button component
const FilterButton: React.FC<{
  title: string;
  isActive: boolean;
  onPress: () => void;
  theme: 'light' | 'dark';
}> = ({ title, isActive, onPress, theme }) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    accent: '#1d7452',
  }), [theme, tokens]);
  
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  }, [scale]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <AnimatedPressable
      style={[
        filterStyles.button,
        {
          backgroundColor: isActive ? themeColors.accent : themeColors.background,
          borderColor: isActive ? themeColors.accent : 'transparent',
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        style={[
          filterStyles.buttonText,
          {
            color: isActive ? '#ffffff' : themeColors.text,
            fontWeight: isActive ? '600' : '500',
          },
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
};

export const RankingList: React.FC<RankingListProps> = ({
  rankings,
  currentUserId,
  title = 'Rankings',
  subtitle,
  showFilters = true,
  showPeriodFilter = true,
  enableSearch = false,
  enableHaptics = true,
  itemAnimationDelay = 100,
  onUserPress,
  theme = 'dark',
  style,
  testID = 'ranking-list',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const [activeFilter, setActiveFilter] = useState<RankingFilter>('all');
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('week');
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    accent: '#1d7452',
  }), [theme, tokens]);
  
  // Filter rankings based on current filters
  const filteredRankings = useMemo(() => {
    let filtered = [...rankings];
    
    // Apply filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'friends':
          // Assuming rankings have a friends relationship
          filtered = filtered.filter(item => item.user.isFriend);
          break;
        case 'class':
          // Assuming rankings have a class relationship
          filtered = filtered.filter(item => item.user.classId === rankings.find(r => r.user.id === currentUserId)?.user.classId);
          break;
      }
    }
    
    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);
    
    // Add positions
    return filtered.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  }, [rankings, activeFilter, currentUserId]);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handleFilterPress = useCallback((filter: RankingFilter) => {
    triggerHaptic();
    setActiveFilter(filter);
  }, [triggerHaptic]);
  
  const handlePeriodPress = useCallback((period: RankingPeriod) => {
    triggerHaptic();
    setActivePeriod(period);
  }, [triggerHaptic]);
  
  const handleUserPress = useCallback((item: RankingData, index: number) => {
    triggerHaptic();
    onUserPress?.(item, index);
  }, [triggerHaptic, onUserPress]);
  
  const renderItem = useCallback(({ item, index }: { item: RankingData; index: number }) => (
    <Pressable
      onPress={() => handleUserPress(item, index)}
      disabled={!onUserPress}
    >
      <RankingListItem
        position={item.position || index + 1}
        user={item.user}
        score={item.score}
        change={item.change}
        isCurrentUser={item.user.id === currentUserId}
        animationDelay={index * itemAnimationDelay}
        enableHaptics={enableHaptics}
        theme={theme}
        testID={`${testID}-item-${index}`}
      />
    </Pressable>
  ), [handleUserPress, onUserPress, currentUserId, itemAnimationDelay, enableHaptics, theme, testID]);
  
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* Filters section */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <FilterButton
              title="All"
              isActive={activeFilter === 'all'}
              onPress={() => handleFilterPress('all')}
              theme={theme}
            />
            <FilterButton
              title="Friends"
              isActive={activeFilter === 'friends'}
              onPress={() => handleFilterPress('friends')}
              theme={theme}
            />
            <FilterButton
              title="Class"
              isActive={activeFilter === 'class'}
              onPress={() => handleFilterPress('class')}
              theme={theme}
            />
          </View>
          
          {showPeriodFilter && (
            <View style={styles.filterRow}>
              <FilterButton
                title="This Week"
                isActive={activePeriod === 'week'}
                onPress={() => handlePeriodPress('week')}
                theme={theme}
              />
              <FilterButton
                title="This Month"
                isActive={activePeriod === 'month'}
                onPress={() => handlePeriodPress('month')}
                theme={theme}
              />
              <FilterButton
                title="All Time"
                isActive={activePeriod === 'all'}
                onPress={() => handlePeriodPress('all')}
                theme={theme}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏆</Text>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        No rankings available
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        Complete some activities to see your ranking!
      </Text>
    </View>
  );
  
  const keyExtractor = useCallback((item: RankingData, index: number) => 
    `${item.user.id}-${index}`, []);
  
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
        data={filteredRankings}
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
    paddingBottom: 32,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  filtersSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
};

const filterStyles = {
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
};

RankingList.displayName = 'RankingList';

export default RankingList;