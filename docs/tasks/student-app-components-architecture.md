# React Native Component Architecture: Student App Components
Agent: frontend-developer
Date: 2025-08-22

## Executive Summary
Comprehensive React Native component architecture plan for Harry School Student App based on existing UI design specifications and technical requirements. This document provides detailed TypeScript interfaces, component hierarchy, state management strategy, styling approach with NativeWind, animation patterns using React Native Reanimated 3, and performance optimization strategies for all 12 components.

## Technical Framework
- **React Native**: 0.73+ with Expo SDK 49+
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand (local) + React Query (server)
- **Animations**: React Native Reanimated 3
- **Icons**: Expo Vector Icons
- **Navigation**: React Navigation 6
- **TypeScript**: Full type safety with interfaces
- **Accessibility**: WCAG 2.1 AA compliance
- **Internationalization**: English, Russian, Uzbek

## Component Architecture Overview

### Component Hierarchy
```
StudentApp/
├── DashboardScreen/
│   ├── DashboardHeader/
│   ├── EventCardsSlider/
│   │   └── EventCard/
│   ├── StatsCard/
│   └── ActionCard/
├── ProfileScreen/
│   ├── ProfileSettings/
│   └── CoinsScoresHistory/
├── LibraryScreen/
│   └── LibraryCard/
├── ServicesScreen/
│   └── ServiceCard/
├── RankingScreen/
│   ├── RankingList/
│   └── RankingListItem/
└── TabNavigation/
```

## Component Specifications

### 1. DashboardHeader Component

#### TypeScript Interface
```typescript
interface DashboardHeaderProps {
  student: StudentProfile;
  notificationsCount: number;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  syncStatus: 'connected' | 'syncing' | 'offline';
}

interface StudentProfile {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  experiencePoints: number;
  nextLevelThreshold: number;
  streak: number;
}
```

#### Component Structure
```typescript
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  student,
  notificationsCount,
  onNotificationPress,
  onProfilePress,
  syncStatus
}) => {
  const progressPercentage = useSharedValue(
    (student.experiencePoints / student.nextLevelThreshold) * 100
  );
  
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progressPercentage.value}%`, {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1)
    })
  }));

  return (
    <View className="bg-hs-dark-bg-primary px-4 pt-12 pb-6">
      {/* Profile Section */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={onProfilePress} className="flex-row items-center">
          <Image
            source={{ uri: student.avatar || '/default-avatar.png' }}
            className="w-12 h-12 rounded-full mr-3"
          />
          <View>
            <Text className="text-white text-lg font-inter-semibold">
              {student.name}
            </Text>
            <Text className="text-hs-text-muted text-sm">
              Level {student.level} • {student.streak} day streak
            </Text>
          </View>
        </TouchableOpacity>
        
        <NotificationBell 
          count={notificationsCount}
          onPress={onNotificationPress}
        />
      </View>
      
      {/* Level Progress Bar */}
      <View className="bg-hs-dark-card-bg rounded-full h-2 mb-2">
        <Animated.View 
          style={[animatedProgressStyle]}
          className="bg-gradient-to-r from-hs-primary to-hs-gold-primary h-full rounded-full"
        />
      </View>
      
      <Text className="text-hs-text-muted text-xs text-center">
        {student.experiencePoints} / {student.nextLevelThreshold} XP to Level {student.level + 1}
      </Text>
    </View>
  );
};
```

#### State Management Strategy
- **Local State**: Animation values, UI states
- **Global State**: Student profile data via Zustand store
- **Server State**: Real-time updates via React Query

#### Animation Patterns
- **Progress Bar**: Smooth fill animation on data changes
- **Notification Badge**: Bounce animation for new notifications
- **Avatar**: Subtle scale animation on press

### 2. EventCard Component

#### TypeScript Interface
```typescript
interface EventCardProps {
  event: Event;
  onPress: () => void;
  isActive?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'lesson' | 'exam' | 'homework' | 'event';
  subject?: string;
  isCompleted?: boolean;
  priority: 'high' | 'medium' | 'low';
}
```

#### Component Structure
```typescript
const EventCard: React.FC<EventCardProps> = ({ event, onPress, isActive = false }) => {
  const scaleValue = useSharedValue(1);
  const borderValue = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    borderWidth: borderValue.value,
  }));

  const handlePress = () => {
    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress();
  };

  useEffect(() => {
    borderValue.value = withTiming(isActive ? 2 : 0, { duration: 300 });
  }, [isActive]);

  const getEventTypeColor = () => {
    switch (event.type) {
      case 'lesson': return 'border-hs-primary';
      case 'exam': return 'border-red-500';
      case 'homework': return 'border-hs-gold-primary';
      default: return 'border-blue-500';
    }
  };

  return (
    <Animated.View 
      style={[animatedStyle]}
      className={`bg-hs-dark-card-bg rounded-xl p-4 mr-4 min-w-[280px] ${getEventTypeColor()}`}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-base font-inter-semibold flex-1">
            {event.title}
          </Text>
          {event.isCompleted && (
            <CheckCircle size={20} color="#10b981" />
          )}
        </View>
        
        <Text className="text-hs-text-muted text-sm mb-3" numberOfLines={2}>
          {event.description}
        </Text>
        
        <View className="flex-row items-center justify-between">
          <Text className="text-hs-gold-primary text-xs font-inter-medium">
            {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
          </Text>
          <EventTypeIcon type={event.type} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 3. EventCardsSlider Component

#### TypeScript Interface
```typescript
interface EventCardsSliderProps {
  events: Event[];
  onEventPress: (event: Event) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}
```

#### Component Structure
```typescript
const EventCardsSlider: React.FC<EventCardsSliderProps> = ({
  events,
  onEventPress,
  refreshing = false,
  onRefresh
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <EventCard
      event={item}
      onPress={() => onEventPress(item)}
      isActive={index === activeIndex}
    />
  );

  return (
    <View className="mb-6">
      <Text className="text-white text-lg font-inter-semibold px-4 mb-4">
        Upcoming Events
      </Text>
      
      <FlatList
        ref={flatListRef}
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1d7452"
            />
          ) : undefined
        }
      />
      
      {/* Pagination Dots */}
      <View className="flex-row justify-center mt-4">
        {events.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === activeIndex ? 'bg-hs-primary' : 'bg-gray-600'
            }`}
          />
        ))}
      </View>
    </View>
  );
};
```

### 4. StatsCard Component

#### TypeScript Interface
```typescript
interface StatsCardProps {
  title: string;
  value: number;
  icon: IconName;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  onPress?: () => void;
  animated?: boolean;
}

type IconName = 'coins' | 'trophy' | 'star' | 'target' | 'book';
```

#### Component Structure
```typescript
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  onPress,
  animated = true
}) => {
  const animatedValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedValue.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) }]
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  useEffect(() => {
    if (animated) {
      animatedValue.value = withDelay(
        Math.random() * 300,
        withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      );
    }
  }, [value]);

  const handlePress = () => {
    if (onPress) {
      scaleValue.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onPress();
    }
  };

  const getIconComponent = () => {
    const iconProps = { size: 24, color: '#fbbf24' };
    switch (icon) {
      case 'coins': return <Coins {...iconProps} />;
      case 'trophy': return <Trophy {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'book': return <Book {...iconProps} />;
      default: return <Star {...iconProps} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Animated.View style={[animatedCardStyle]} className="flex-1 mx-2">
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        className="bg-hs-dark-card-bg rounded-xl p-4"
      >
        <View className="flex-row items-center justify-between mb-2">
          {getIconComponent()}
          {trend && trendValue && (
            <View className="flex-row items-center">
              <TrendingUp size={12} className={getTrendColor()} />
              <Text className={`text-xs ml-1 ${getTrendColor()}`}>
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </Text>
            </View>
          )}
        </View>
        
        <Animated.Text 
          style={[animatedTextStyle]}
          className="text-white text-2xl font-inter-bold mb-1"
        >
          {value.toLocaleString()}
        </Animated.Text>
        
        <Text className="text-hs-text-muted text-sm font-inter-medium">
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 5. ActionCard Component

#### TypeScript Interface
```typescript
interface ActionCardProps {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  badge?: {
    text: string;
    variant: 'new' | 'urgent' | 'recommended';
  };
}
```

#### Component Structure
```typescript
const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onPress,
  disabled = false,
  badge
}) => {
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(disabled ? 0.5 : 1);
  const shimmerValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerValue.value, [0, 1], [-100, 300]) }
    ],
  }));

  useEffect(() => {
    opacityValue.value = withTiming(disabled ? 0.5 : 1, { duration: 300 });
  }, [disabled]);

  useEffect(() => {
    // Shimmer effect for recommended actions
    if (badge?.variant === 'recommended') {
      shimmerValue.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [badge]);

  const handlePress = () => {
    if (!disabled) {
      scaleValue.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onPress();
    }
  };

  const getBadgeStyle = () => {
    switch (badge?.variant) {
      case 'new': return 'bg-blue-500';
      case 'urgent': return 'bg-red-500';
      case 'recommended': return 'bg-hs-gold-primary';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Animated.View style={[animatedStyle]} className="mb-4">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled}
        className="bg-gradient-to-r from-hs-primary to-hs-primary-dark rounded-xl p-6 relative overflow-hidden"
      >
        {/* Shimmer Effect */}
        {badge?.variant === 'recommended' && (
          <Animated.View
            style={[shimmerStyle]}
            className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-20 w-24 -skew-x-12"
          />
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-white text-lg font-inter-semibold mb-2">
              {title}
            </Text>
            <Text className="text-white opacity-80 text-sm">
              {description}
            </Text>
          </View>
          
          <View className="items-center">
            <ActionIcon icon={icon} />
            {badge && (
              <View className={`px-2 py-1 rounded-full mt-2 ${getBadgeStyle()}`}>
                <Text className="text-white text-xs font-inter-medium">
                  {badge.text}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 6. TabNavigation Component

#### TypeScript Interface
```typescript
interface TabNavigationProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  badges?: Record<TabName, number>;
}

type TabName = 'home' | 'vocabulary' | 'library' | 'ranking' | 'profile';

interface TabConfig {
  name: TabName;
  icon: IconComponent;
  label: string;
  accessibilityLabel: string;
}
```

#### Component Structure
```typescript
const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  badges = {}
}) => {
  const tabConfigs: TabConfig[] = [
    { name: 'home', icon: Home, label: 'Home', accessibilityLabel: 'Dashboard tab' },
    { name: 'vocabulary', icon: Book, label: 'Words', accessibilityLabel: 'Vocabulary tab' },
    { name: 'library', icon: Library, label: 'Library', accessibilityLabel: 'Content library tab' },
    { name: 'ranking', icon: Trophy, label: 'Ranking', accessibilityLabel: 'Leaderboard tab' },
    { name: 'profile', icon: User, label: 'Profile', accessibilityLabel: 'Profile settings tab' }
  ];

  return (
    <View className="bg-hs-dark-card-bg border-t border-gray-800 px-2 py-1">
      <View className="flex-row justify-around items-center">
        {tabConfigs.map((tab) => (
          <TabButton
            key={tab.name}
            config={tab}
            isActive={activeTab === tab.name}
            badge={badges[tab.name]}
            onPress={() => onTabChange(tab.name)}
          />
        ))}
      </View>
    </View>
  );
};

const TabButton: React.FC<{
  config: TabConfig;
  isActive: boolean;
  badge?: number;
  onPress: () => void;
}> = ({ config, isActive, badge, onPress }) => {
  const scaleValue = useSharedValue(1);
  const colorValue = useSharedValue(isActive ? 1 : 0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorValue.value,
      [0, 1],
      ['#9ca3af', '#1d7452']
    )
  }));

  useEffect(() => {
    colorValue.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  const handlePress = () => {
    scaleValue.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle]} className="items-center py-2 px-3 min-w-[60px]">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="items-center"
        accessibilityLabel={config.accessibilityLabel}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <View className="relative">
          <config.icon
            size={24}
            color={isActive ? '#1d7452' : '#9ca3af'}
          />
          {badge && badge > 0 && (
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
              <Text className="text-white text-xs font-inter-medium">
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>
        
        <Animated.Text
          style={[animatedTextStyle]}
          className="text-xs font-inter-medium mt-1"
        >
          {config.label}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 7. ProfileSettings Component

#### TypeScript Interface
```typescript
interface ProfileSettingsProps {
  settings: SettingSection[];
  onSettingPress: (settingId: string) => void;
}

interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean | string;
  onToggle?: (value: boolean) => void;
  badge?: string;
  destructive?: boolean;
}
```

#### Component Structure
```typescript
const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  settings,
  onSettingPress
}) => {
  return (
    <ScrollView className="flex-1 bg-hs-dark-bg-primary">
      {settings.map((section, sectionIndex) => (
        <View key={section.id} className="mb-6">
          <Text className="text-hs-text-muted text-sm font-inter-medium px-4 mb-3 uppercase">
            {section.title}
          </Text>
          
          <View className="bg-hs-dark-card-bg mx-4 rounded-xl overflow-hidden">
            {section.items.map((item, itemIndex) => (
              <SettingRow
                key={item.id}
                item={item}
                onPress={() => onSettingPress(item.id)}
                isLast={itemIndex === section.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const SettingRow: React.FC<{
  item: SettingItem;
  onPress: () => void;
  isLast: boolean;
}> = ({ item, onPress, isLast }) => {
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  const handlePress = () => {
    if (item.type !== 'toggle') {
      scaleValue.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onPress();
    }
  };

  const renderRightComponent = () => {
    switch (item.type) {
      case 'toggle':
        return (
          <Switch
            value={item.value as boolean}
            onValueChange={item.onToggle}
            trackColor={{ false: '#374151', true: '#1d7452' }}
            thumbColor="#ffffff"
          />
        );
      case 'navigation':
        return <ChevronRight size={20} color="#9ca3af" />;
      default:
        return item.badge ? (
          <View className="bg-hs-primary px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-inter-medium">
              {item.badge}
            </Text>
          </View>
        ) : null;
    }
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
        className={`flex-row items-center px-4 py-4 ${!isLast ? 'border-b border-gray-800' : ''}`}
      >
        <SettingIcon icon={item.icon} destructive={item.destructive} />
        
        <View className="flex-1 ml-3">
          <Text className={`text-base font-inter-medium ${
            item.destructive ? 'text-red-500' : 'text-white'
          }`}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text className="text-hs-text-muted text-sm mt-1">
              {item.subtitle}
            </Text>
          )}
        </View>
        
        {renderRightComponent()}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 8. CoinsScoresHistory Component

#### TypeScript Interface
```typescript
interface CoinsScoresHistoryProps {
  historyData: HistoryEntry[];
  filterType: 'all' | 'coins' | 'scores';
  onFilterChange: (filter: 'all' | 'coins' | 'scores') => void;
  onLoadMore?: () => void;
  loading?: boolean;
}

interface HistoryEntry {
  id: string;
  type: 'coins' | 'score';
  amount: number;
  description: string;
  timestamp: Date;
  source: string;
  category: 'lesson' | 'quiz' | 'achievement' | 'bonus';
}
```

#### Component Structure
```typescript
const CoinsScoresHistory: React.FC<CoinsScoresHistoryProps> = ({
  historyData,
  filterType,
  onFilterChange,
  onLoadMore,
  loading = false
}) => {
  const filteredData = useMemo(() => {
    if (filterType === 'all') return historyData;
    return historyData.filter(entry => entry.type === filterType);
  }, [historyData, filterType]);

  const renderHistoryItem = ({ item, index }: { item: HistoryEntry; index: number }) => (
    <HistoryItem entry={item} index={index} />
  );

  return (
    <View className="flex-1 bg-hs-dark-bg-primary">
      {/* Filter Tabs */}
      <View className="flex-row bg-hs-dark-card-bg mx-4 rounded-xl p-1 mb-4">
        {['all', 'coins', 'scores'].map((filter) => (
          <FilterTab
            key={filter}
            label={filter === 'all' ? 'All' : filter === 'coins' ? 'Coins' : 'Scores'}
            isActive={filterType === filter}
            onPress={() => onFilterChange(filter as any)}
          />
        ))}
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => 
          loading ? <LoadingSpinner /> : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const HistoryItem: React.FC<{ entry: HistoryEntry; index: number }> = ({ entry, index }) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  useEffect(() => {
    translateY.value = withDelay(
      index * 100,
      withTiming(0, { duration: 400 })
    );
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const getTypeIcon = () => {
    return entry.type === 'coins' ? (
      <Coins size={24} color="#fbbf24" />
    ) : (
      <Star size={24} color="#1d7452" />
    );
  };

  const getCategoryColor = () => {
    switch (entry.category) {
      case 'lesson': return 'text-blue-400';
      case 'quiz': return 'text-green-400';
      case 'achievement': return 'text-purple-400';
      case 'bonus': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Animated.View
      style={[animatedStyle]}
      className="bg-hs-dark-card-bg rounded-xl p-4 mb-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {getTypeIcon()}
          
          <View className="ml-3 flex-1">
            <Text className="text-white text-base font-inter-medium">
              {entry.description}
            </Text>
            <Text className={`text-sm ${getCategoryColor()} mt-1`}>
              {entry.source} • {format(entry.timestamp, 'MMM d, HH:mm')}
            </Text>
          </View>
        </View>
        
        <Text className={`text-lg font-inter-bold ${
          entry.amount > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {entry.amount > 0 ? '+' : ''}{entry.amount}
        </Text>
      </View>
    </Animated.View>
  );
};
```

### 9. LibraryCard Component

#### TypeScript Interface
```typescript
interface LibraryCardProps {
  category: LibraryCategory;
  onPress: () => void;
  progress?: number;
  isLocked?: boolean;
}

interface LibraryCategory {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  icon: IconName;
  color: string;
  gradient: [string, string];
  thumbnail?: string;
}
```

#### Component Structure
```typescript
const LibraryCard: React.FC<LibraryCardProps> = ({
  category,
  onPress,
  progress = 0,
  isLocked = false
}) => {
  const scaleValue = useSharedValue(1);
  const progressValue = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`
  }));

  useEffect(() => {
    progressValue.value = withDelay(
      300,
      withTiming(progress, { duration: 800 })
    );
  }, [progress]);

  const handlePress = () => {
    if (!isLocked) {
      scaleValue.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onPress();
    }
  };

  return (
    <Animated.View style={[animatedStyle]} className="w-[48%] mb-4">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isLocked}
        className="relative overflow-hidden rounded-xl"
      >
        <LinearGradient
          colors={category.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 aspect-square"
        >
          {/* Lock Overlay */}
          {isLocked && (
            <View className="absolute inset-0 bg-black bg-opacity-60 items-center justify-center">
              <Lock size={32} color="white" />
              <Text className="text-white text-sm font-inter-medium mt-2">
                Locked
              </Text>
            </View>
          )}

          <View className="flex-1 justify-between">
            <View className="flex-row items-center justify-between">
              <LibraryIcon icon={category.icon} size={32} color="white" />
              <Text className="text-white text-xs bg-black bg-opacity-30 px-2 py-1 rounded-full">
                {category.itemCount} items
              </Text>
            </View>

            <View>
              <Text className="text-white text-lg font-inter-bold mb-1">
                {category.title}
              </Text>
              <Text className="text-white text-sm opacity-80" numberOfLines={2}>
                {category.description}
              </Text>
              
              {progress > 0 && (
                <View className="mt-3">
                  <View className="bg-white bg-opacity-30 rounded-full h-2">
                    <Animated.View
                      style={[progressStyle]}
                      className="bg-white rounded-full h-full"
                    />
                  </View>
                  <Text className="text-white text-xs mt-1">
                    {Math.round(progress)}% complete
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 10. ServiceCard Component

#### TypeScript Interface
```typescript
interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  color: string;
  badge?: {
    text: string;
    color: string;
  };
}
```

#### Component Structure
```typescript
const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  disabled = false,
  comingSoon = false
}) => {
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { rotateY: `${rotateValue.value}deg` }
    ]
  }));

  const handlePress = () => {
    if (!disabled && !comingSoon) {
      scaleValue.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      rotateValue.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      onPress();
    }
  };

  return (
    <Animated.View style={[animatedStyle]} className="w-[48%] mb-4">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled || comingSoon}
        className={`bg-hs-dark-card-bg rounded-xl p-4 aspect-square ${
          disabled || comingSoon ? 'opacity-50' : ''
        }`}
      >
        <View className="flex-1 justify-between">
          <View className="items-center">
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: service.color }}
            >
              <ServiceIcon icon={service.icon} size={32} color="white" />
            </View>
            
            {service.badge && (
              <View 
                className="px-2 py-1 rounded-full mb-2"
                style={{ backgroundColor: service.badge.color }}
              >
                <Text className="text-white text-xs font-inter-medium">
                  {service.badge.text}
                </Text>
              </View>
            )}
            
            {comingSoon && (
              <View className="bg-orange-500 px-2 py-1 rounded-full mb-2">
                <Text className="text-white text-xs font-inter-medium">
                  Coming Soon
                </Text>
              </View>
            )}
          </View>

          <View>
            <Text className="text-white text-base font-inter-semibold text-center mb-1">
              {service.title}
            </Text>
            <Text className="text-hs-text-muted text-sm text-center" numberOfLines={2}>
              {service.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 11. RankingListItem Component

#### TypeScript Interface
```typescript
interface RankingListItemProps {
  student: RankedStudent;
  currentUserId: string;
  onPress?: () => void;
  animationDelay?: number;
}

interface RankedStudent {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  score: number;
  isVerified?: boolean;
  level: number;
  badge?: 'gold' | 'silver' | 'bronze';
  streak?: number;
}
```

#### Component Structure
```typescript
const RankingListItem: React.FC<RankingListItemProps> = ({
  student,
  currentUserId,
  onPress,
  animationDelay = 0
}) => {
  const translateX = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scaleValue.value }
    ],
    opacity: opacity.value
  }));

  useEffect(() => {
    translateX.value = withDelay(
      animationDelay,
      withTiming(0, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
    );
    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const handlePress = () => {
    if (onPress) {
      scaleValue.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onPress();
    }
  };

  const isCurrentUser = student.id === currentUserId;

  const getRankIcon = () => {
    if (student.rank <= 3) {
      const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
      return (
        <View 
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors[student.rank - 1] }}
        >
          <Crown size={16} color="white" />
        </View>
      );
    }
    
    return (
      <View className="w-8 h-8 rounded-full bg-gray-600 items-center justify-center">
        <Text className="text-white text-sm font-inter-bold">
          {student.rank}
        </Text>
      </View>
    );
  };

  const getBadgeIcon = () => {
    if (!student.badge) return null;
    
    const badgeColors = {
      gold: '#ffd700',
      silver: '#c0c0c0',
      bronze: '#cd7f32'
    };

    return (
      <View 
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
        style={{ backgroundColor: badgeColors[student.badge] }}
      >
        <Star size={12} color="white" />
      </View>
    );
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className={`flex-row items-center p-4 mb-2 rounded-xl ${
          isCurrentUser 
            ? 'bg-gradient-to-r from-hs-primary to-hs-primary-dark border border-hs-gold-primary' 
            : 'bg-hs-dark-card-bg'
        }`}
      >
        {/* Rank */}
        <View className="mr-4">
          {getRankIcon()}
        </View>

        {/* Avatar */}
        <View className="relative mr-3">
          <Image
            source={{ uri: student.avatar || '/default-avatar.png' }}
            className="w-12 h-12 rounded-full"
          />
          {getBadgeIcon()}
          {student.isVerified && (
            <View className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
              <CheckCircle size={12} color="white" />
            </View>
          )}
        </View>

        {/* Student Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className={`text-base font-inter-semibold ${
              isCurrentUser ? 'text-white' : 'text-white'
            }`}>
              {student.name}
            </Text>
            {isCurrentUser && (
              <View className="ml-2 bg-hs-gold-primary px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-inter-medium">You</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mt-1">
            <Text className={`text-sm ${
              isCurrentUser ? 'text-white opacity-80' : 'text-hs-text-muted'
            }`}>
              Level {student.level}
            </Text>
            {student.streak && (
              <>
                <Text className="text-hs-text-muted mx-2">•</Text>
                <Fire size={12} color="#f59e0b" />
                <Text className="text-orange-400 text-sm ml-1">
                  {student.streak}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Score */}
        <View className="items-end">
          <Text className={`text-lg font-inter-bold ${
            isCurrentUser ? 'text-hs-gold-primary' : 'text-white'
          }`}>
            {student.score.toLocaleString()}
          </Text>
          <Text className={`text-xs ${
            isCurrentUser ? 'text-white opacity-80' : 'text-hs-text-muted'
          }`}>
            points
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 12. RankingList Component

#### TypeScript Interface
```typescript
interface RankingListProps {
  students: RankedStudent[];
  currentUserId: string;
  onStudentPress?: (student: RankedStudent) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}
```

#### Component Structure
```typescript
const RankingList: React.FC<RankingListProps> = ({
  students,
  currentUserId,
  onStudentPress,
  onRefresh,
  refreshing = false,
  onLoadMore,
  loading = false
}) => {
  const currentUserIndex = students.findIndex(s => s.id === currentUserId);

  const renderStudent = ({ item, index }: { item: RankedStudent; index: number }) => (
    <RankingListItem
      student={item}
      currentUserId={currentUserId}
      onPress={() => onStudentPress?.(item)}
      animationDelay={index * 50}
    />
  );

  const renderHeader = () => (
    <View className="mb-4">
      {/* Top 3 Podium */}
      {students.length >= 3 && (
        <PodiumView topThree={students.slice(0, 3)} currentUserId={currentUserId} />
      )}
      
      {/* Current User Position (if not in top visible) */}
      {currentUserIndex > 10 && (
        <View className="mt-4 mb-2">
          <Text className="text-hs-text-muted text-sm px-4 mb-2">Your Position</Text>
          <RankingListItem
            student={students[currentUserIndex]}
            currentUserId={currentUserId}
            onPress={() => onStudentPress?.(students[currentUserIndex])}
          />
          <View className="h-px bg-gray-700 mx-4 my-4" />
        </View>
      )}
      
      <Text className="text-white text-lg font-inter-semibold px-4 mb-2">
        Full Rankings
      </Text>
    </View>
  );

  return (
    <FlatList
      data={students}
      renderItem={renderStudent}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1d7452"
            colors={['#1d7452']}
          />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={() => 
        loading ? <LoadingSpinner className="py-4" /> : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const PodiumView: React.FC<{
  topThree: RankedStudent[];
  currentUserId: string;
}> = ({ topThree, currentUserId }) => {
  const podiumHeights = [80, 100, 60]; // 2nd, 1st, 3rd place heights
  const podiumOrder = [topThree[1], topThree[0], topThree[2]]; // Arrange for podium visual

  return (
    <View className="bg-gradient-to-b from-hs-primary to-hs-primary-dark rounded-xl p-6 mb-6">
      <Text className="text-white text-xl font-inter-bold text-center mb-6">
        🏆 Top Performers
      </Text>
      
      <View className="flex-row items-end justify-center">
        {podiumOrder.map((student, index) => {
          if (!student) return null;
          
          const isCurrentUser = student.id === currentUserId;
          const height = podiumHeights[index];
          
          return (
            <PodiumPosition
              key={student.id}
              student={student}
              height={height}
              isCurrentUser={isCurrentUser}
            />
          );
        })}
      </View>
    </View>
  );
};

const PodiumPosition: React.FC<{
  student: RankedStudent;
  height: number;
  isCurrentUser: boolean;
}> = ({ student, height, isCurrentUser }) => {
  const scaleValue = useSharedValue(0);
  const translateY = useSharedValue(50);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { translateY: translateY.value }
    ]
  }));

  useEffect(() => {
    scaleValue.value = withDelay(
      student.rank * 200,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    translateY.value = withDelay(
      student.rank * 200,
      withSpring(0, { damping: 12, stiffness: 200 })
    );
  }, []);

  const getRankEmoji = () => {
    switch (student.rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  return (
    <Animated.View style={[animatedStyle]} className="items-center mx-3">
      <View className="items-center mb-2">
        <View className={`relative ${isCurrentUser ? 'ring-2 ring-hs-gold-primary' : ''} rounded-full`}>
          <Image
            source={{ uri: student.avatar || '/default-avatar.png' }}
            className="w-16 h-16 rounded-full"
          />
          {student.isVerified && (
            <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
              <CheckCircle size={12} color="white" />
            </View>
          )}
        </View>
        
        <Text className="text-white text-sm font-inter-semibold mt-2 text-center">
          {student.name}
        </Text>
        <Text className="text-hs-gold-primary text-lg font-inter-bold">
          {student.score.toLocaleString()}
        </Text>
      </View>
      
      <View 
        className={`bg-gradient-to-t ${
          student.rank === 1 
            ? 'from-yellow-600 to-yellow-400' 
            : student.rank === 2 
            ? 'from-gray-600 to-gray-400'
            : 'from-orange-600 to-orange-400'
        } rounded-t-lg w-20 items-center justify-center`}
        style={{ height }}
      >
        <Text className="text-white text-2xl">
          {getRankEmoji()}
        </Text>
        <Text className="text-white text-lg font-inter-bold">
          #{student.rank}
        </Text>
      </View>
    </Animated.View>
  );
};
```

## State Management Strategy

### Zustand Stores

#### Student Store
```typescript
interface StudentState {
  profile: StudentProfile | null;
  preferences: UserPreferences;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const useStudentStore = create<StudentState>((set) => ({
  profile: null,
  preferences: defaultPreferences,
  updateProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile!, ...profile }
    })),
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs }
    }))
}));
```

#### Dashboard Store
```typescript
interface DashboardState {
  events: Event[];
  stats: StudentStats;
  loading: boolean;
  lastSync: Date | null;
  setEvents: (events: Event[]) => void;
  updateStats: (stats: Partial<StudentStats>) => void;
  setLoading: (loading: boolean) => void;
}

const useDashboardStore = create<DashboardState>((set) => ({
  events: [],
  stats: initialStats,
  loading: false,
  lastSync: null,
  setEvents: (events) => set({ events }),
  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats }
    })),
  setLoading: (loading) => set({ loading })
}));
```

### React Query Configuration

#### Query Keys
```typescript
export const queryKeys = {
  student: {
    profile: (id: string) => ['student', 'profile', id],
    dashboard: (id: string) => ['student', 'dashboard', id],
    events: (id: string) => ['student', 'events', id],
    ranking: () => ['ranking'],
    history: (id: string, filter: string) => ['student', 'history', id, filter]
  }
} as const;
```

#### Custom Hooks
```typescript
export const useStudentDashboard = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.student.dashboard(studentId),
    queryFn: () => fetchStudentDashboard(studentId),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });
};

export const useStudentEvents = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.student.events(studentId),
    queryFn: () => fetchStudentEvents(studentId),
    staleTime: 60000, // 1 minute
    select: (data) => data.filter(event => !event.isCompleted)
  });
};
```

## Styling Approach with NativeWind

### Design Tokens
```typescript
// tailwind.config.js extensions for Harry School theme
module.exports = {
  theme: {
    extend: {
      colors: {
        'hs-dark-bg-primary': '#1a1a1a',
        'hs-dark-bg-secondary': '#2d2d2d',
        'hs-dark-card-bg': '#2a2a2a',
        'hs-primary': '#1d7452',
        'hs-primary-dark': '#175d42',
        'hs-gold-primary': '#fbbf24',
        'hs-gold-secondary': '#f59e0b',
        'hs-text-muted': '#9ca3af',
        'hs-text-secondary': '#d1d5db'
      },
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  }
};
```

### Common Style Patterns
```typescript
// Shared styling utilities
export const commonStyles = {
  card: 'bg-hs-dark-card-bg rounded-xl p-4',
  cardInteractive: 'bg-hs-dark-card-bg rounded-xl p-4 active:scale-95',
  button: 'bg-hs-primary rounded-lg py-3 px-6 active:scale-95',
  input: 'bg-hs-dark-card-bg border border-gray-700 rounded-lg p-3 text-white',
  text: {
    heading: 'text-white text-lg font-inter-semibold',
    body: 'text-white text-base font-inter-regular',
    caption: 'text-hs-text-muted text-sm font-inter-medium'
  }
};
```

## Animation Patterns with React Native Reanimated 3

### Common Animation Utilities
```typescript
// Animation utilities for consistent behavior
export const animationConfig = {
  spring: { damping: 15, stiffness: 200 },
  timing: { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) },
  fastTiming: { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) }
};

export const useScaleAnimation = (triggerValue?: any) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const trigger = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.95, animationConfig.fastTiming),
      withTiming(1, animationConfig.fastTiming)
    );
  }, []);
  
  return { animatedStyle, trigger };
};

export const useFadeInAnimation = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));
  
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, animationConfig.timing));
    translateY.value = withDelay(delay, withTiming(0, animationConfig.timing));
  }, []);
  
  return animatedStyle;
};
```

### Gesture Handling
```typescript
// Swipe gesture for cards
export const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, 100],
        [1, 0.7],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > 100;
      
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withTiming(
          direction === 'right' ? 300 : -300,
          animationConfig.timing
        );
        opacity.value = withTiming(0, animationConfig.timing);
        
        runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)?.();
      } else {
        translateX.value = withSpring(0, animationConfig.spring);
        opacity.value = withTiming(1, animationConfig.timing);
      }
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value
  }));
  
  return { gesture, animatedStyle };
};
```

## Performance Optimization

### Component Memoization
```typescript
// Memoization patterns for expensive components
export const MemoizedEventCard = React.memo(EventCard, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.event.isCompleted === nextProps.event.isCompleted
  );
});

export const MemoizedRankingListItem = React.memo(RankingListItem, (prevProps, nextProps) => {
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.rank === nextProps.student.rank &&
    prevProps.student.score === nextProps.student.score &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});
```

### Virtual List Optimization
```typescript
// FlashList configuration for large datasets
export const RankingFlashList: React.FC<RankingListProps> = ({ students, ...props }) => {
  const renderItem = useCallback(({ item, index }) => (
    <MemoizedRankingListItem
      student={item}
      currentUserId={props.currentUserId}
      onPress={props.onStudentPress}
      animationDelay={index * 20}
    />
  ), [props.currentUserId, props.onStudentPress]);

  return (
    <FlashList
      data={students}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
};
```

### Image Optimization
```typescript
// Optimized image component with caching
export const OptimizedImage: React.FC<{
  source: { uri?: string };
  className?: string;
  placeholder?: string;
}> = ({ source, className, placeholder = '/default-avatar.png' }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Image
      source={{ 
        uri: imageError ? placeholder : source.uri || placeholder,
        cache: 'force-cache'
      }}
      className={className}
      onError={() => setImageError(true)}
      fadeDuration={200}
    />
  );
};
```

## File Structure Organization

```
mobile/packages/ui/components/
├── dashboard/
│   ├── DashboardHeader/
│   │   ├── index.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── NotificationBell.tsx
│   │   └── types.ts
│   ├── EventCard/
│   │   ├── index.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventTypeIcon.tsx
│   │   └── types.ts
│   ├── EventCardsSlider/
│   │   ├── index.tsx
│   │   ├── EventCardsSlider.tsx
│   │   └── types.ts
│   ├── StatsCard/
│   │   ├── index.tsx
│   │   ├── StatsCard.tsx
│   │   ├── StatsIcon.tsx
│   │   └── types.ts
│   └── ActionCard/
│       ├── index.tsx
│       ├── ActionCard.tsx
│       ├── ActionIcon.tsx
│       └── types.ts
├── navigation/
│   └── TabNavigation/
│       ├── index.tsx
│       ├── TabNavigation.tsx
│       ├── TabButton.tsx
│       └── types.ts
├── profile/
│   ├── ProfileSettings/
│   │   ├── index.tsx
│   │   ├── ProfileSettings.tsx
│   │   ├── SettingRow.tsx
│   │   ├── SettingIcon.tsx
│   │   └── types.ts
│   └── CoinsScoresHistory/
│       ├── index.tsx
│       ├── CoinsScoresHistory.tsx
│       ├── HistoryItem.tsx
│       ├── FilterTab.tsx
│       └── types.ts
├── library/
│   └── LibraryCard/
│       ├── index.tsx
│       ├── LibraryCard.tsx
│       ├── LibraryIcon.tsx
│       └── types.ts
├── services/
│   └── ServiceCard/
│       ├── index.tsx
│       ├── ServiceCard.tsx
│       ├── ServiceIcon.tsx
│       └── types.ts
├── ranking/
│   ├── RankingList/
│   │   ├── index.tsx
│   │   ├── RankingList.tsx
│   │   ├── PodiumView.tsx
│   │   ├── PodiumPosition.tsx
│   │   └── types.ts
│   └── RankingListItem/
│       ├── index.tsx
│       ├── RankingListItem.tsx
│       └── types.ts
├── shared/
│   ├── LoadingSpinner/
│   ├── OptimizedImage/
│   └── ErrorBoundary/
├── animations/
│   ├── useScaleAnimation.ts
│   ├── useFadeInAnimation.ts
│   ├── useSwipeGesture.ts
│   └── animationConfig.ts
├── styles/
│   ├── commonStyles.ts
│   ├── colors.ts
│   └── typography.ts
└── index.ts
```

## Testing Strategy

### Unit Tests
```typescript
// Example test for DashboardHeader
describe('DashboardHeader', () => {
  const mockStudent: StudentProfile = {
    id: '1',
    name: 'John Doe',
    level: 5,
    experiencePoints: 750,
    nextLevelThreshold: 1000,
    streak: 7
  };

  it('renders student information correctly', () => {
    render(
      <DashboardHeader
        student={mockStudent}
        notificationsCount={3}
        onNotificationPress={jest.fn()}
        onProfilePress={jest.fn()}
        syncStatus="connected"
      />
    );

    expect(screen.getByText('John Doe')).toBeOnTheScreen();
    expect(screen.getByText('Level 5 • 7 day streak')).toBeOnTheScreen();
  });

  it('animates progress bar correctly', async () => {
    const { rerender } = render(
      <DashboardHeader
        student={mockStudent}
        notificationsCount={0}
        onNotificationPress={jest.fn()}
        onProfilePress={jest.fn()}
        syncStatus="connected"
      />
    );

    // Test progress bar animation
    const updatedStudent = { ...mockStudent, experiencePoints: 900 };
    rerender(
      <DashboardHeader
        student={updatedStudent}
        notificationsCount={0}
        onNotificationPress={jest.fn()}
        onProfilePress={jest.fn()}
        syncStatus="connected"
      />
    );

    // Animation should trigger - test would verify animated style changes
    await waitFor(() => {
      // Assert animated progress bar width change
    });
  });
});
```

### Integration Tests
```typescript
// Example integration test for dashboard components
describe('Dashboard Integration', () => {
  it('should handle event card interactions correctly', async () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Math Quiz',
        description: 'Chapter 5 assessment',
        startTime: new Date(),
        endTime: new Date(),
        type: 'quiz',
        priority: 'high'
      }
    ];

    const onEventPress = jest.fn();

    render(
      <EventCardsSlider
        events={mockEvents}
        onEventPress={onEventPress}
      />
    );

    const eventCard = screen.getByText('Math Quiz');
    fireEvent.press(eventCard);

    expect(onEventPress).toHaveBeenCalledWith(mockEvents[0]);
  });
});
```

### Accessibility Tests
```typescript
describe('Accessibility Compliance', () => {
  it('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(<TabNavigation activeTab="home" onTabChange={jest.fn()} />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support screen reader navigation', () => {
    render(<TabNavigation activeTab="home" onTabChange={jest.fn()} />);
    
    const homeTab = screen.getByLabelText('Dashboard tab');
    expect(homeTab).toHaveAccessibilityState({ selected: true });
    expect(homeTab).toHaveAccessibilityRole('tab');
  });
});
```

## Key Implementation Notes

### Performance Targets
- **Component Render Time**: <16ms (60 FPS)
- **List Scroll Performance**: 60 FPS sustained
- **Animation Performance**: GPU accelerated, 60 FPS
- **Memory Usage**: <100MB for component library
- **Bundle Size**: <500KB for UI components

### Accessibility Compliance
- **Touch Targets**: Minimum 44pt (iOS), 48pt recommended
- **Color Contrast**: 4.5:1 minimum ratio
- **Screen Reader**: Full VoiceOver/TalkBack support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Reduced Motion**: Respects user preferences

### Internationalization Support
- **Text Scaling**: Supports up to 200% dynamic type
- **RTL Layout**: Prepared for Arabic support
- **Cultural Adaptations**: Islamic calendar integration
- **Multilingual**: EN/RU/UZ with expansion capability

### Cultural Integration
- **Islamic Values**: Respectful design patterns
- **Educational Context**: Age-appropriate interactions
- **Family Engagement**: Parent-friendly interfaces
- **Uzbekistan Context**: Local cultural considerations

This comprehensive component architecture provides a solid foundation for implementing all 12 Student App components with excellent performance, accessibility, and cultural sensitivity for the Harry School educational platform.