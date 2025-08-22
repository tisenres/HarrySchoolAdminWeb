# Mobile Architecture: Modern Gamified Student App
Agent: mobile-developer  
Date: 2025-08-22

## Executive Summary
This document outlines a comprehensive mobile architecture for a modern, secular, gamified student learning app built with React Native and Expo. The architecture focuses on educational engagement through points, achievements, and interactive lessons while maintaining high performance and offline capabilities.

## Key Requirements Addressed
- ✅ Remove all Islamic content - create secular educational experience
- ✅ Modern Design System - Contemporary UI patterns
- ✅ Gamification Focus - Points, coins, levels, achievements
- ✅ Interactive Lessons - Multiple task types with AI integration
- ✅ Offline-First Architecture
- ✅ Cross-platform React Native + Expo

## Architecture Overview

### Technology Stack
```yaml
Platform: React Native + Expo SDK 51+
Language: TypeScript
State Management: Zustand (client) + React Query (server)
Navigation: React Navigation 6
UI Framework: Custom Design System + NativeWind
Animations: React Native Reanimated 3
Backend: Supabase (real-time, auth, storage)
AI Services: OpenAI GPT-4, Whisper API
```

### Project Structure
```
apps/student/
├── src/
│   ├── components/           # UI Components (Atomic Design)
│   │   ├── atoms/           # Basic elements (Button, Text, Input)
│   │   ├── molecules/       # Card, ProgressBar, AchievementBadge
│   │   ├── organisms/       # Dashboard, LessonPlayer, Leaderboard
│   │   └── templates/       # Screen layouts
│   ├── screens/             # Screen Components
│   │   ├── auth/           # Login, Onboarding
│   │   ├── dashboard/      # Home dashboard
│   │   ├── lessons/        # Interactive lessons
│   │   ├── vocabulary/     # Flashcards, translator
│   │   ├── schedule/       # Calendar, attendance
│   │   └── profile/        # Settings, achievements
│   ├── navigation/         # Navigation structure
│   ├── services/           # API calls, offline sync
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Helper functions
│   ├── constants/         # Colors, dimensions, config
│   └── assets/            # Images, animations, icons
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json
```

## Navigation Architecture

### Bottom Tab + Stack Pattern
```typescript
// Root Navigation Structure
RootStack
├── AuthStack (if not authenticated)
│   ├── Onboarding (4 slides)
│   └── Login
└── MainTabs (if authenticated)
    ├── HomeTab (Stack)
    │   ├── Dashboard
    │   ├── QuickActions
    │   └── Notifications
    ├── LessonsTab (Stack)
    │   ├── LessonsList
    │   ├── LessonDetail
    │   ├── TextLesson
    │   ├── QuizLesson
    │   ├── SpeakingLesson
    │   ├── ListeningLesson
    │   └── WritingLesson
    ├── VocabularyTab (Stack)
    │   ├── WordsList
    │   ├── Flashcards
    │   ├── Practice
    │   └── Translator
    ├── ScheduleTab (Stack)
    │   ├── Calendar
    │   ├── AttendanceHistory
    │   └── ClassDetail
    └── ProfileTab (Stack)
        ├── Profile
        ├── Achievements
        ├── Leaderboard
        ├── Rewards
        ├── Settings
        └── Referral
```

### Navigation Implementation
```typescript
// navigation/types.ts
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Vocabulary: undefined;
  Schedule: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  QuickActions: undefined;
  Notifications: undefined;
};

// navigation/MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack, LessonsStack, VocabularyStack, ScheduleStack, ProfileStack } from './stacks';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: '#1d7452',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        animation: 'fade',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Lessons" 
        component={LessonsStack}
        options={{
          title: 'Lessons',
          tabBarIcon: ({ color, size }) => <BookIcon color={color} size={size} />,
          tabBarBadge: unreadLessonsCount > 0 ? unreadLessonsCount : undefined,
        }}
      />
      <Tab.Screen 
        name="Vocabulary" 
        component={VocabularyStack}
        options={{
          title: 'Words',
          tabBarIcon: ({ color, size }) => <VocabularyIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleStack}
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

## Component Architecture (Atomic Design)

### Design System Foundation
```typescript
// constants/design.ts
export const Colors = {
  // Primary Brand
  primary: '#1d7452',
  primaryLight: '#4a9675',
  primaryDark: '#0f4e35',
  
  // Gamification Colors
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
  
  // Status Colors
  success: '#00c851',
  warning: '#ffbb33',
  error: '#ff4444',
  info: '#33b5e5',
  
  // Grayscale
  black: '#000000',
  gray900: '#1a1a1a',
  gray800: '#2d2d2d',
  gray700: '#404040',
  gray600: '#666666',
  gray500: '#8e8e93',
  gray400: '#c7c7cc',
  gray300: '#d1d1d6',
  gray200: '#e5e5ea',
  gray100: '#f2f2f7',
  white: '#ffffff',
  
  // Background
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  surface: '#ffffff',
  
  // Points & Rewards
  points: '#ff6b6b',
  coins: '#ffd93d',
  streak: '#ff8c42',
  level: '#6c5ce7',
};

export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  
  // Body Text
  body1: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  
  // UI Text
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

### Atomic Components

#### Atoms (Basic Elements)
```typescript
// components/atoms/Button.tsx
import { Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  onPress, 
  disabled, 
  loading, 
  icon 
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          styles[variant],
          styles[size],
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? 'white' : Colors.primary} />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  // Size variants
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  // Text styles
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.gray900,
  },
  ghostText: {
    color: Colors.primary,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
```

#### Molecules (Compound Components)
```typescript
// components/molecules/ProgressBar.tsx
import Animated, { useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  showPercentage?: boolean;
  celebrateOnComplete?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  backgroundColor = Colors.gray200,
  progressColor = Colors.primary,
  animated = true,
  showPercentage = false,
  celebrateOnComplete = true,
}: ProgressBarProps) {
  const animatedWidth = useAnimatedStyle(() => {
    const width = animated 
      ? withTiming(progress * 100 + '%', { duration: 800 })
      : progress * 100 + '%';
    
    return {
      width,
    };
  });

  const celebrationStyle = useAnimatedStyle(() => {
    if (celebrateOnComplete && progress >= 1) {
      return {
        transform: [{ scale: withSpring(1.05) }],
      };
    }
    return {};
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.track,
          { backgroundColor, height },
          celebrationStyle,
        ]}
      >
        <Animated.View 
          style={[
            styles.fill,
            { backgroundColor: progressColor, height },
            animatedWidth,
          ]} 
        />
      </Animated.View>
      {showPercentage && (
        <Text style={styles.percentage}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
}

// components/molecules/AchievementBadge.tsx
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence,
  withTiming,
  withSpring,
  FadeInUp,
  BounceIn,
} from 'react-native-reanimated';

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  onPress?: () => void;
}

export function AchievementBadge({
  title,
  description,
  icon,
  rarity,
  unlocked,
  onPress,
}: AchievementBadgeProps) {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const handlePress = () => {
    if (unlocked) {
      scale.value = withSequence(
        withSpring(0.9),
        withSpring(1.1),
        withSpring(1)
      );
      
      // Shimmer effect
      shimmer.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 600 })
      );
    }
    
    onPress?.();
  };

  return (
    <Animated.View 
      entering={unlocked ? BounceIn.delay(300) : FadeInUp}
      style={animatedStyle}
    >
      <Pressable onPress={handlePress} style={[styles.badge, styles[rarity]]}>
        {/* Shimmer overlay for unlocked badges */}
        {unlocked && (
          <Animated.View style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        )}
        
        <Text style={[styles.icon, !unlocked && styles.locked]}>{icon}</Text>
        <Text style={[styles.title, !unlocked && styles.lockedText]}>{title}</Text>
        <Text style={[styles.description, !unlocked && styles.lockedText]}>
          {description}
        </Text>
        
        {!unlocked && <LockIcon size={16} color={Colors.gray500} />}
      </Pressable>
    </Animated.View>
  );
}
```

#### Organisms (Complex Components)
```typescript
// components/organisms/Dashboard.tsx
import { RefreshControl } from 'react-native';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

export function Dashboard() {
  const { user, stats, refreshing, onRefresh } = useDashboard();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={styles.header}
      >
        <DashboardHeader user={user} />
      </Animated.View>

      {/* Quick Stats Cards */}
      <Animated.View 
        entering={SlideInRight.delay(200)}
        style={styles.statsGrid}
      >
        <StatsCard
          title="Current Rank"
          value={`#${stats.rank}`}
          subtitle={`${stats.points} points`}
          icon="🏆"
          color={Colors.gold}
        />
        <StatsCard
          title="Streak"
          value={`${stats.streak} days`}
          subtitle="Keep it up!"
          icon="🔥"
          color={Colors.streak}
        />
        <StatsCard
          title="Level"
          value={stats.level}
          subtitle={`${stats.xpToNextLevel} XP to next`}
          icon="⭐"
          color={Colors.level}
        />
        <StatsCard
          title="Coins"
          value={stats.coins}
          subtitle="Available to spend"
          icon="🪙"
          color={Colors.coins}
        />
      </Animated.View>

      {/* Today's Schedule */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <TodayScheduleCard />
      </Animated.View>

      {/* Pending Tasks */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <PendingTasksCard />
      </Animated.View>

      {/* Recent Achievements */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <RecentAchievementsCard />
      </Animated.View>

      {/* Quick Actions FAB */}
      <QuickActionsFAB />
    </ScrollView>
  );
}
```

## State Management Strategy

### Zustand Stores
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { user } = await supabase.auth.signInWithPassword(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));

// stores/gamificationStore.ts
interface GamificationState {
  points: number;
  coins: number;
  level: number;
  streak: number;
  rank: number;
  achievements: Achievement[];
  addPoints: (points: number) => void;
  spendCoins: (amount: number) => boolean;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  points: 0,
  coins: 0,
  level: 1,
  streak: 0,
  rank: 999,
  achievements: [],

  addPoints: (points) => {
    const current = get();
    const newPoints = current.points + points;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    
    set({ 
      points: newPoints, 
      level: newLevel,
      coins: current.coins + Math.floor(points / 10), // 10 points = 1 coin
    });

    // Check for level up achievements
    if (newLevel > current.level) {
      // Trigger level up celebration
      hapticFeedback();
      showLevelUpAnimation();
    }
  },

  spendCoins: (amount) => {
    const current = get();
    if (current.coins >= amount) {
      set({ coins: current.coins - amount });
      return true;
    }
    return false;
  },

  unlockAchievement: (achievementId) => {
    const current = get();
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievement && !current.achievements.find(a => a.id === achievementId)) {
      set({ 
        achievements: [...current.achievements, { ...achievement, unlockedAt: new Date() }],
        coins: current.coins + achievement.reward
      });
      showAchievementUnlocked(achievement);
    }
  },

  updateStreak: () => {
    const current = get();
    const lastActivity = getLastActivityDate();
    const today = new Date();
    
    if (isConsecutiveDay(lastActivity, today)) {
      set({ streak: current.streak + 1 });
    } else {
      set({ streak: 1 });
    }
  },
}));
```

### React Query Integration
```typescript
// hooks/useLessons.ts
export function useLessons(groupId: string) {
  return useQuery({
    queryKey: ['lessons', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, progress(*)')
        .eq('group_id', groupId)
        .order('order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!groupId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  const { addPoints } = useGamificationStore();

  return useMutation({
    mutationFn: async ({ lessonId, score, timeSpent }: CompleteLessonData) => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          score,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['dashboard']);
      
      // Add points for completion
      const pointsEarned = calculatePoints(variables.score, variables.timeSpent);
      addPoints(pointsEarned);

      // Show success animation
      showLessonCompleteAnimation(pointsEarned);
    },
  });
}
```

## Animation Strategy

### Micro-Interactions & Gamification Animations
```typescript
// utils/animations.ts
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export function usePointsAnimation() {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  const animatePointsGain = (points: number) => {
    // Celebration sequence
    scale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );

    // Float up effect
    translateY.value = withSequence(
      withTiming(-20, { duration: 800 }),
      withTiming(0, { duration: 200 })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0.8, { duration: 700 }),
      withTiming(1, { duration: 200 })
    );

    // Haptic feedback
    runOnJS(hapticFeedback)();
  };

  return { animatedStyle, animatePointsGain };
}

export function useAchievementUnlockAnimation() {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const triggerUnlockAnimation = () => {
    // Pop-in effect
    scale.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withSpring(1, { damping: 8 })
    );

    // Slight rotation for dynamism
    rotation.value = withSequence(
      withTiming(5, { duration: 100 }),
      withTiming(-3, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Shimmer effect
    shimmer.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 500 })
    );

    runOnJS(hapticFeedback)();
  };

  return { animatedStyle, shimmerStyle, triggerUnlockAnimation };
}

export function useLessonProgressAnimation() {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const updateProgress = (newProgress: number) => {
    progress.value = withTiming(newProgress, { 
      duration: 1000,
    }, (finished) => {
      if (finished && newProgress === 100) {
        runOnJS(celebrateCompletion)();
      }
    });
  };

  return { animatedStyle, updateProgress };
}
```

### Screen Transitions
```typescript
// components/transitions/ScreenTransition.tsx
import { TransitionSpecs } from '@react-navigation/bottom-tabs';

export const screenTransitionConfig = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      },
    },
    close: {
      animation: 'timing', 
      config: {
        duration: 250,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      },
    },
  },
  sceneStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width * 0.1, 0],
            }),
          },
        ],
      },
    };
  },
};
```

## Feature Implementation Plans

### 1. Dashboard Screen
```typescript
// screens/DashboardScreen.tsx
export function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Animated Header */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <DashboardHeader />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <Animated.View entering={SlideInRight.delay(200)}>
          <QuickStatsGrid />
        </Animated.View>

        {/* Today's Schedule */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <TodayScheduleCard />
        </Animated.View>

        {/* Pending Tasks */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <PendingTasksCard />
        </Animated.View>

        {/* Recent Achievements */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <RecentAchievementsCard />
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <QuickActionsFAB />
    </SafeAreaView>
  );
}

// Components breakdown:
interface DashboardHeaderProps {
  user: User;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

interface QuickStatsGridProps {
  stats: {
    rank: number;
    points: number;
    streak: number;
    level: number;
    coins: number;
  };
}
```

### 2. Interactive Lessons
```typescript
// screens/lessons/LessonPlayerScreen.tsx
export function LessonPlayerScreen({ route }: LessonPlayerScreenProps) {
  const { lessonId } = route.params;
  const { lesson, loading } = useLesson(lessonId);

  if (loading) return <LessonSkeleton />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Header */}
      <LessonProgressHeader 
        currentStep={lesson.currentStep}
        totalSteps={lesson.totalSteps}
        onExit={() => navigation.goBack()}
      />

      {/* Dynamic Content Renderer */}
      <LessonContentRenderer
        content={lesson.content}
        type={lesson.type}
        onComplete={handleStepComplete}
        onNext={handleNext}
      />

      {/* Bottom Actions */}
      <LessonActions
        canProceed={canProceed}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onHint={handleHint}
      />
    </SafeAreaView>
  );
}

// Lesson types with their specific implementations:
export enum LessonType {
  TEXT = 'text',
  QUIZ = 'quiz',
  SPEAKING = 'speaking',
  LISTENING = 'listening',
  WRITING = 'writing',
  MIXED = 'mixed',
}
```

### 3. Vocabulary System
```typescript
// screens/vocabulary/FlashcardsScreen.tsx
export function FlashcardsScreen() {
  const { words } = useVocabularyWords();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <FlashcardHeader 
        currentIndex={currentIndex}
        total={words.length}
        onBack={() => navigation.goBack()}
      />

      <FlashcardStack
        words={words}
        currentIndex={currentIndex}
        isFlipped={isFlipped}
        onFlip={setIsFlipped}
        onSwipe={handleSwipe}
        onKnown={handleKnown}
        onUnknown={handleUnknown}
      />

      <FlashcardControls
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFlip={() => setIsFlipped(!isFlipped)}
        onShuffle={handleShuffle}
      />
    </SafeAreaView>
  );
}
```

### 4. Gamification Components
```typescript
// components/gamification/LeaderboardCard.tsx
export function LeaderboardCard() {
  const { rankings, myRank } = useLeaderboard();

  return (
    <Card style={styles.container}>
      <CardHeader>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Your rank: #{myRank}</Text>
      </CardHeader>

      <ScrollView>
        {rankings.slice(0, 10).map((student, index) => (
          <Animated.View
            key={student.id}
            entering={FadeInRight.delay(index * 100)}
          >
            <LeaderboardItem
              rank={index + 1}
              student={student}
              isCurrentUser={student.id === currentUserId}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <Button
        title="View Full Leaderboard"
        variant="ghost"
        onPress={() => navigation.navigate('FullLeaderboard')}
      />
    </Card>
  );
}

// components/gamification/AchievementSystem.tsx
export const ACHIEVEMENTS = [
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    rarity: 'common',
    points: 50,
    reward: 10,
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Study for 7 days in a row',
    icon: '🔥',
    rarity: 'rare',
    points: 200,
    reward: 50,
  },
  {
    id: 'vocab_master',
    title: 'Word Wizard',
    description: 'Master 100 vocabulary words',
    icon: '📚',
    rarity: 'epic',
    points: 500,
    reward: 100,
  },
  {
    id: 'perfect_month',
    title: 'Legendary Scholar',
    description: 'Perfect attendance for a month',
    icon: '👑',
    rarity: 'legendary',
    points: 1000,
    reward: 250,
  },
];
```

## Offline-First Strategy

### Data Synchronization
```typescript
// services/OfflineService.ts
export class OfflineService {
  private queue: OfflineAction[] = [];
  private isOnline = true;

  constructor() {
    this.setupNetworkListener();
    this.loadQueueFromStorage();
  }

  async queueAction(action: OfflineAction) {
    this.queue.push({
      ...action,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
    });
    
    await this.saveQueueToStorage();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const action = this.queue[0];
    
    try {
      await this.executeAction(action);
      this.queue.shift();
      await this.saveQueueToStorage();
      
      // Process next action
      this.processQueue();
    } catch (error) {
      action.retries++;
      
      if (action.retries >= MAX_RETRIES) {
        this.queue.shift(); // Remove failed action
        console.error('Action failed after max retries:', action);
      }
      
      await this.saveQueueToStorage();
    }
  }

  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'COMPLETE_LESSON':
        return this.completeLessonOnline(action.payload);
      case 'UPDATE_PROGRESS':
        return this.updateProgressOnline(action.payload);
      case 'MARK_ATTENDANCE':
        return this.markAttendanceOnline(action.payload);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
```

### Local Storage Schema
```typescript
// Database schema for offline storage
import { SQLiteDatabase } from 'expo-sqlite/next';

export const createTables = async (db: SQLiteDatabase) => {
  // Lessons cache
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      type TEXT,
      group_id TEXT,
      order_index INTEGER,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  // Progress tracking
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      lesson_id TEXT,
      user_id TEXT,
      score INTEGER,
      time_spent INTEGER,
      completed_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );
  `);

  // Vocabulary words
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      translation TEXT,
      definition TEXT,
      example TEXT,
      difficulty INTEGER,
      mastery_level INTEGER DEFAULT 0,
      last_reviewed TEXT,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  // Offline actions queue
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT,
      timestamp INTEGER,
      retries INTEGER DEFAULT 0
    );
  `);
};
```

## Performance Optimizations

### List Rendering
```typescript
// components/lists/OptimizedLessonsList.tsx
import { FlashList } from '@shopify/flash-list';

interface LessonsListProps {
  lessons: Lesson[];
  onLessonPress: (lesson: Lesson) => void;
}

export function OptimizedLessonsList({ lessons, onLessonPress }: LessonsListProps) {
  const renderLesson = useCallback(({ item, index }: { item: Lesson; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 50)}
      style={styles.lessonItem}
    >
      <LessonCard
        lesson={item}
        onPress={() => onLessonPress(item)}
      />
    </Animated.View>
  ), [onLessonPress]);

  const getItemType = useCallback((item: Lesson) => {
    return item.type; // Different types for better recycling
  }, []);

  return (
    <FlashList
      data={lessons}
      renderItem={renderLesson}
      getItemType={getItemType}
      estimatedItemSize={120}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
```

### Image Optimization
```typescript
// components/ui/OptimizedImage.tsx
import { Image } from 'expo-image';

interface OptimizedImageProps {
  source: string | { uri: string };
  style?: any;
  placeholder?: string;
  contentFit?: 'cover' | 'contain' | 'fill';
}

export function OptimizedImage({ 
  source, 
  style, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IiNGMkYyRjciLz4KPC9zdmc+',
  contentFit = 'cover'
}: OptimizedImageProps) {
  return (
    <Image
      source={source}
      style={style}
      placeholder={placeholder}
      contentFit={contentFit}
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}
```

### Memory Management
```typescript
// hooks/useMemoryOptimization.ts
export function useMemoryOptimization() {
  useEffect(() => {
    const cleanup = () => {
      // Clear image cache periodically
      Image.clearDiskCache();
      
      // Clear query cache for old data
      queryClient.clear();
      
      // Run garbage collection hint
      if (__DEV__) {
        global.gc && global.gc();
      }
    };

    // Cleanup on app background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        cleanup();
      }
    });

    return () => subscription?.remove();
  }, []);
}
```

## Testing Strategy

### Component Testing
```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/atoms/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
```

### Integration Testing
```typescript
// __tests__/flows/LessonCompletion.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { LessonPlayerScreen } from '../screens/lessons/LessonPlayerScreen';

describe('Lesson Completion Flow', () => {
  it('completes lesson and awards points', async () => {
    const { getByText, getByTestId } = render(
      <LessonPlayerScreen route={{ params: { lessonId: '1' } }} />
    );

    // Wait for lesson to load
    await waitFor(() => {
      expect(getByText('Lesson Title')).toBeTruthy();
    });

    // Complete lesson steps
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('submit-button'));

    // Check points awarded
    await waitFor(() => {
      expect(getByText('+50 Points')).toBeTruthy();
    });
  });
});
```

## Security Considerations

### Data Protection
```typescript
// utils/security.ts
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

export class SecurityManager {
  private static ENCRYPTION_KEY = 'user-data-key';

  static async storeSecurely(key: string, value: string) {
    const encrypted = CryptoJS.AES.encrypt(value, this.ENCRYPTION_KEY).toString();
    await SecureStore.setItemAsync(key, encrypted);
  }

  static async getSecurely(key: string): Promise<string | null> {
    const encrypted = await SecureStore.getItemAsync(key);
    if (!encrypted) return null;

    const bytes = CryptoJS.AES.decrypt(encrypted, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  }

  static validateApiResponse(data: any): boolean {
    // Implement response validation
    return typeof data === 'object' && data !== null;
  }
}
```

## Deployment Strategy

### Expo Configuration
```json
// app.json
{
  "expo": {
    "name": "Harry School Student",
    "slug": "harry-school-student",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1d7452"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "uz.harryschool.student",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access is needed for speaking tasks",
        "NSMicrophoneUsageDescription": "Microphone access is needed for pronunciation practice"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "uz.harryschool.student",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-image",
      "expo-av",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow camera access for speaking tasks"
        }
      ]
    ]
  }
}
```

### EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-asc-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Success Metrics

### Performance Targets
- **App Launch Time**: < 2 seconds
- **Screen Transitions**: < 300ms
- **Lesson Loading**: < 1 second
- **Offline Sync**: < 5 seconds when online
- **Memory Usage**: < 200MB average
- **Bundle Size**: < 50MB
- **Battery Drain**: < 2% per hour active use

### User Engagement Targets
- **Daily Active Users**: 80%+
- **Lesson Completion Rate**: 90%+
- **Average Session Time**: 15+ minutes
- **Streak Retention**: 70% maintain 7-day streak
- **Achievement Unlock Rate**: 85% unlock first achievement

### Technical Quality Targets
- **Crash-Free Sessions**: 99.9%+
- **App Store Rating**: 4.5+ stars
- **Network Success Rate**: 99%+
- **Offline Functionality**: 100% core features work offline

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Project setup and navigation structure
- ✅ Design system and basic components
- ✅ Authentication flow
- ✅ Basic dashboard layout

### Phase 2: Core Features (Weeks 3-4)
- ✅ Lesson player implementation
- ✅ Vocabulary system
- ✅ Gamification core
- ✅ Offline sync foundation

### Phase 3: Advanced Features (Weeks 5-6)
- ✅ AI integrations
- ✅ Advanced animations
- ✅ Performance optimizations
- ✅ Testing implementation

### Phase 4: Polish & Launch (Weeks 7-8)
- ✅ Bug fixes and optimizations
- ✅ Store preparation
- ✅ Beta testing
- ✅ Launch preparation

## Conclusion

This mobile architecture provides a comprehensive foundation for building a modern, engaging, and performant student learning app. The secular, gamified approach combined with offline-first architecture ensures students can learn effectively regardless of connectivity, while the modern design and animations create an engaging educational experience.

The architecture prioritizes:
- **User Experience**: Smooth animations, intuitive navigation, engaging gamification
- **Performance**: Optimized rendering, efficient caching, minimal battery usage
- **Scalability**: Modular component architecture, efficient state management
- **Reliability**: Offline-first design, error handling, comprehensive testing
- **Maintainability**: Clean code structure, TypeScript safety, comprehensive documentation

This foundation supports the development of a world-class educational mobile application that can effectively engage students and improve learning outcomes.