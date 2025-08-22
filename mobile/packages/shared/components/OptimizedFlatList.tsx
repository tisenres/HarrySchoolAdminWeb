import React, { 
  useCallback, 
  useMemo, 
  useRef, 
  useState, 
  useEffect,
  memo,
} from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewStyle,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { MMKV } from 'react-native-mmkv';

const { height: screenHeight } = Dimensions.get('window');

// Storage for list positions and optimization data
const listStorage = new MMKV({
  id: 'optimized-list-storage',
  encryptionKey: 'harry-school-lists',
});

export interface OptimizedListItem {
  id: string;
  height?: number;
  type?: string;
}

export interface OptimizedFlatListProps<T extends OptimizedListItem> 
  extends Omit<FlatListProps<T>, 'renderItem' | 'keyExtractor' | 'getItemLayout'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  listId: string;
  useFlashList?: boolean;
  estimatedItemSize?: number;
  fixedItemHeight?: number;
  enableVirtualization?: boolean;
  enableScrollOptimization?: boolean;
  enablePersistentScrollPosition?: boolean;
  onScrollThreshold?: number;
  onScrollCallback?: (offset: number) => void;
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  respectPrayerTime?: boolean;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  enableInfiniteScroll?: boolean;
  onEndReached?: () => Promise<void>;
  endReachedThreshold?: number;
  batchSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  scrollEventThrottle?: number;
}

// Memoized list item wrapper for performance
const MemoizedListItem = memo<{
  item: OptimizedListItem;
  index: number;
  renderItem: ListRenderItem<OptimizedListItem>;
  culturalTheme: string;
}>(({ item, index, renderItem, culturalTheme }) => {
  const itemStyle = useMemo(() => ({
    backgroundColor: culturalTheme === 'islamic' ? '#f0f9f0' : 
                     culturalTheme === 'educational' ? '#f0f4ff' : '#ffffff',
  }), [culturalTheme]);

  return (
    <View style={itemStyle}>
      {renderItem({ item, index, separators: {} as any })}
    </View>
  );
});

MemoizedListItem.displayName = 'MemoizedListItem';

const OptimizedFlatList = <T extends OptimizedListItem>({
  data,
  renderItem,
  listId,
  useFlashList = true,
  estimatedItemSize = 60,
  fixedItemHeight,
  enableVirtualization = true,
  enableScrollOptimization = true,
  enablePersistentScrollPosition = true,
  onScrollThreshold = 50,
  onScrollCallback,
  culturalTheme = 'modern',
  respectPrayerTime = true,
  loadingComponent: LoadingComponent,
  emptyComponent: EmptyComponent,
  errorComponent: ErrorComponent,
  enablePullToRefresh = true,
  onRefresh,
  enableInfiniteScroll = true,
  onEndReached,
  endReachedThreshold = 0.2,
  batchSize = 10,
  windowSize = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 16,
  removeClippedSubviews = true,
  scrollEventThrottle = 16,
  style,
  ...otherProps
}: OptimizedFlatListProps<T>) => {
  const flatListRef = useRef<FlatList<T> | FlashList<T>>(null);
  const scrollY = useSharedValue(0);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  // Performance optimization: Check prayer time for reduced animations
  const checkPrayerTime = useCallback(() => {
    if (!respectPrayerTime) return false;
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }, [respectPrayerTime]);

  // Cultural theme colors
  const getCulturalColors = useCallback(() => {
    switch (culturalTheme) {
      case 'islamic':
        return {
          primary: '#1d7452',
          secondary: '#22c55e',
          background: '#f0f9f0',
          accent: '#dcfce7',
        };
      case 'educational':
        return {
          primary: '#2563eb',
          secondary: '#3b82f6',
          background: '#f0f4ff',
          accent: '#dbeafe',
        };
      case 'modern':
      default:
        return {
          primary: '#6b7280',
          secondary: '#9ca3af',
          background: '#ffffff',
          accent: '#f3f4f6',
        };
    }
  }, [culturalTheme]);

  const colors = getCulturalColors();

  // Optimized keyExtractor
  const keyExtractor = useCallback((item: T, index: number) => {
    return item.id || `item-${index}`;
  }, []);

  // Optimized getItemLayout for fixed heights
  const getItemLayout = useCallback(
    (data: T[] | null | undefined, index: number) => {
      if (!fixedItemHeight) return undefined;
      
      return {
        length: fixedItemHeight,
        offset: fixedItemHeight * index,
        index,
      };
    },
    [fixedItemHeight]
  );

  // Memoized render item with performance optimizations
  const memoizedRenderItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => (
      <MemoizedListItem
        item={item}
        index={index}
        renderItem={renderItem}
        culturalTheme={culturalTheme}
      />
    ),
    [renderItem, culturalTheme]
  );

  // Scroll handler with optimization
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      if (enableScrollOptimization && onScrollCallback) {
        if (Math.abs(event.contentOffset.y - scrollY.value) > onScrollThreshold) {
          runOnJS(onScrollCallback)(event.contentOffset.y);
        }
      }
    },
    onEndDrag: (event) => {
      if (enablePersistentScrollPosition) {
        const position = event.contentOffset.y;
        runOnJS(setLastScrollPosition)(position);
        listStorage.set(`${listId}-scroll-position`, position);
      }
    },
  }, [listId, enablePersistentScrollPosition, enableScrollOptimization]);

  // Restore scroll position on focus
  useFocusEffect(
    useCallback(() => {
      if (enablePersistentScrollPosition && flatListRef.current) {
        const savedPosition = listStorage.getNumber(`${listId}-scroll-position`) || 0;
        if (savedPosition > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: savedPosition,
              animated: false,
            });
          }, 100);
        }
      }
    }, [listId, enablePersistentScrollPosition])
  );

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Optimized infinite scroll handler
  const handleEndReached = useCallback(async () => {
    if (!onEndReached || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      await onEndReached();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load more failed');
    } finally {
      setIsLoadingMore(false);
    }
  }, [onEndReached, isLoadingMore]);

  // Refresh control with cultural theming
  const refreshControl = useMemo(() => {
    if (!enablePullToRefresh || !onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
        colors={[colors.primary, colors.secondary]}
        progressBackgroundColor={colors.background}
      />
    );
  }, [enablePullToRefresh, onRefresh, isRefreshing, handleRefresh, colors]);

  // Loading more indicator
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={[styles.loadingFooter, { backgroundColor: colors.background }]}>
        {LoadingComponent ? (
          <LoadingComponent />
        ) : (
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Loading more...
          </Text>
        )}
      </View>
    );
  }, [isLoadingMore, LoadingComponent, colors]);

  // Empty state component
  const renderEmpty = useCallback(() => {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.primary }]}>
          No items found
        </Text>
      </View>
    );
  }, [EmptyComponent, colors]);

  // Error state component
  const renderError = useCallback(() => {
    if (!error) return null;
    
    const handleRetry = () => {
      setError(null);
      handleRefresh();
    };
    
    if (ErrorComponent) {
      return <ErrorComponent error={error} onRetry={handleRetry} />;
    }
    
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.primary }]}>
          {error}
        </Text>
      </View>
    );
  }, [error, ErrorComponent, colors, handleRefresh]);

  // Common props for both FlatList and FlashList
  const commonProps = useMemo(() => ({
    data,
    keyExtractor,
    refreshControl,
    ListEmptyComponent: renderEmpty,
    ListFooterComponent: renderFooter,
    onEndReached: enableInfiniteScroll ? handleEndReached : undefined,
    onEndReachedThreshold: endReachedThreshold,
    removeClippedSubviews,
    scrollEventThrottle,
    style: [{ backgroundColor: colors.background }, style],
    ...otherProps,
  }), [
    data,
    keyExtractor,
    refreshControl,
    renderEmpty,
    renderFooter,
    enableInfiniteScroll,
    handleEndReached,
    endReachedThreshold,
    removeClippedSubviews,
    scrollEventThrottle,
    colors.background,
    style,
    otherProps,
  ]);

  // Show error if present
  if (error) {
    return renderError();
  }

  // FlashList for better performance
  if (useFlashList && Platform.OS !== 'web') {
    const flashListProps: FlashListProps<T> = {
      ...commonProps,
      renderItem: memoizedRenderItem,
      estimatedItemSize: fixedItemHeight || estimatedItemSize,
    };

    return (
      <Animated.View style={{ flex: 1 }} onLayout={() => {}}>
        <FlashList
          ref={flatListRef as any}
          {...flashListProps}
        />
      </Animated.View>
    );
  }

  // Fallback to regular FlatList with optimizations
  const flatListProps: FlatListProps<T> = {
    ...commonProps,
    renderItem: memoizedRenderItem,
    getItemLayout: fixedItemHeight ? getItemLayout : undefined,
    initialNumToRender: batchSize,
    windowSize,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    disableVirtualization: !enableVirtualization,
  };

  return (
    <Animated.FlatList
      ref={flatListRef as any}
      onScroll={enableScrollOptimization ? scrollHandler : undefined}
      {...flatListProps}
    />
  );
};

// Pre-configured list components for common use cases
export const StudentList = <T extends OptimizedListItem & { name: string; grade?: string }>(
  props: Omit<OptimizedFlatListProps<T>, 'listId' | 'culturalTheme'>
) => (
  <OptimizedFlatList
    {...props}
    listId="students"
    culturalTheme="educational"
    fixedItemHeight={72}
    enableVirtualization={true}
    batchSize={15}
  />
);

export const TeacherList = <T extends OptimizedListItem & { name: string; subject?: string }>(
  props: Omit<OptimizedFlatListProps<T>, 'listId' | 'culturalTheme'>
) => (
  <OptimizedFlatList
    {...props}
    listId="teachers"
    culturalTheme="islamic"
    fixedItemHeight={80}
    enableVirtualization={true}
    respectPrayerTime={true}
    batchSize={10}
  />
);

export const LessonList = <T extends OptimizedListItem & { title: string; duration?: number }>(
  props: Omit<OptimizedFlatListProps<T>, 'listId' | 'culturalTheme'>
) => (
  <OptimizedFlatList
    {...props}
    listId="lessons"
    culturalTheme="educational"
    estimatedItemSize={100}
    enableVirtualization={true}
    batchSize={8}
  />
);

export const VocabularyList = <T extends OptimizedListItem & { word: string; translation?: string }>(
  props: Omit<OptimizedFlatListProps<T>, 'listId' | 'culturalTheme'>
) => (
  <OptimizedFlatList
    {...props}
    listId="vocabulary"
    culturalTheme="educational"
    fixedItemHeight={64}
    enableVirtualization={true}
    useFlashList={true}
    batchSize={20}
    windowSize={8}
  />
);

const styles = StyleSheet.create({
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight * 0.5,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default OptimizedFlatList;