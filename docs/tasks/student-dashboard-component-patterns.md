# Student Dashboard Component Patterns Documentation

**Date**: 2025-08-20  
**Command**: 11 - Create Student Dashboard with Performance Optimizer  
**Documentation Source**: context7 MCP server research on React Native Paper patterns  

## Executive Summary

This document outlines comprehensive component patterns for the Harry School Student Dashboard, based on research from React Native Paper and educational mobile UI best practices. The patterns focus on age-appropriate design, performance optimization, and engaging educational micro-interactions.

## Component Architecture Patterns

### 1. Educational Card Pattern

Based on React Native Paper's `Card` component with educational adaptations:

```typescript
// Base Educational Card Pattern
interface EducationalCardProps {
  title: string;
  subtitle?: string;
  ageGroup: '10-12' | '13-15' | '16-18';
  gamificationEnabled: boolean;
  progress?: number;
  onPress?: () => void;
  children: React.ReactNode;
}

const EducationalCard: React.FC<EducationalCardProps> = ({
  title,
  subtitle,
  ageGroup,
  gamificationEnabled,
  progress,
  onPress,
  children
}) => {
  const cardElevation = ageGroup === '10-12' ? 4 : 2; // Higher for younger users
  const cardMode = ageGroup === '16-18' ? 'outlined' : 'elevated';
  
  return (
    <Card
      mode={cardMode}
      elevation={cardElevation}
      onPress={onPress}
      style={[
        styles.educationalCard,
        ageGroup === '10-12' && styles.elementaryCard
      ]}
    >
      {gamificationEnabled && progress !== undefined && (
        <ProgressBar 
          progress={progress / 100} 
          color={Colors.primary}
          style={styles.progressOverlay}
        />
      )}
      
      <Card.Title
        title={title}
        subtitle={subtitle}
        titleStyle={[
          styles.cardTitle,
          ageGroup === '10-12' && styles.elementaryTitle
        ]}
      />
      
      <Card.Content>
        {children}
      </Card.Content>
    </Card>
  );
};
```

### 2. Animated Counter Pattern

Educational micro-animation pattern for engaging number displays:

```typescript
// Animated Counter with Celebration Effects
interface AnimatedCounterProps {
  value: number;
  previousValue?: number;
  ageGroup: '10-12' | '13-15' | '16-18';
  label: string;
  suffix?: string;
  celebrationThreshold?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  previousValue,
  ageGroup,
  label,
  suffix = '',
  celebrationThreshold
}) => {
  const animatedValue = useSharedValue(previousValue || 0);
  const celebrationOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Animate counter
    animatedValue.value = withTiming(value, {
      duration: ageGroup === '10-12' ? 1000 : 500,
      easing: Easing.out(Easing.quad)
    });
    
    // Trigger celebration for significant increases
    if (celebrationThreshold && value - (previousValue || 0) >= celebrationThreshold) {
      celebrationOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1000, withTiming(0, { duration: 500 }))
      );
    }
  }, [value]);

  const animatedText = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(animatedValue.value, [0, value], [0.8, 1]) }]
    };
  });

  const celebrationStyle = useAnimatedStyle(() => {
    return {
      opacity: celebrationOpacity.value,
      transform: [
        { scale: interpolate(celebrationOpacity.value, [0, 1], [0.5, 1.2]) },
        { rotate: `${celebrationOpacity.value * 360}deg` }
      ]
    };
  });

  return (
    <View style={styles.counterContainer}>
      <Animated.View style={animatedText}>
        <Title style={[
          styles.counterValue,
          ageGroup === '10-12' && styles.elementaryCounter
        ]}>
          {Math.round(animatedValue.value)}{suffix}
        </Title>
      </Animated.View>
      
      <Caption style={styles.counterLabel}>{label}</Caption>
      
      {ageGroup === '10-12' && (
        <Animated.View style={[styles.celebration, celebrationStyle]}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
        </Animated.View>
      )}
    </View>
  );
};
```

### 3. Progress Ring Pattern

Visual progress indication with age-appropriate complexity:

```typescript
// Educational Progress Ring
interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  ageGroup: '10-12' | '13-15' | '16-18';
  showLabel?: boolean;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  ageGroup,
  showLabel = true,
  color = Colors.primary
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: ageGroup === '10-12' ? 1500 : 800,
      easing: Easing.out(Easing.cubic)
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * animatedProgress.value) / 100;
    return {
      strokeDashoffset
    };
  });

  const backgroundRing = {
    stroke: ageGroup === '10-12' ? Colors.grey300 : Colors.grey200,
    strokeWidth,
    fill: 'transparent',
    r: radius,
    cx: size / 2,
    cy: size / 2
  };

  const progressRing = {
    stroke: color,
    strokeWidth,
    fill: 'transparent',
    r: radius,
    cx: size / 2,
    cy: size / 2,
    strokeDasharray: circumference,
    strokeLinecap: 'round' as const,
    transform: 'rotate(-90deg)',
    transformOrigin: `${size / 2} ${size / 2}`
  };

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle {...backgroundRing} />
        <AnimatedCircle {...progressRing} animatedProps={animatedProps} />
      </Svg>
      
      {showLabel && (
        <View style={styles.progressLabel}>
          <Text style={[
            styles.progressText,
            ageGroup === '10-12' && styles.elementaryProgressText
          ]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};
```

### 4. Achievement Badge Pattern

Gamified achievement display with celebration animations:

```typescript
// Achievement Badge with Rarity System
interface AchievementBadgeProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earned_date?: string;
  };
  ageGroup: '10-12' | '13-15' | '16-18';
  isNewlyEarned?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  ageGroup,
  isNewlyEarned = false,
  size = 'medium'
}) => {
  const glowOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  const rarityColors = {
    common: Colors.grey600,
    rare: Colors.blue500,
    epic: Colors.purple500,
    legendary: Colors.amber500
  };

  const sizeConfig = {
    small: { diameter: 48, iconSize: 24, titleSize: 12 },
    medium: { diameter: 64, iconSize: 32, titleSize: 14 },
    large: { diameter: 80, iconSize: 40, titleSize: 16 }
  };

  const config = sizeConfig[size];
  const rarityColor = rarityColors[achievement.rarity];

  useEffect(() => {
    if (isNewlyEarned && ageGroup === '10-12') {
      // Celebration animation for new achievements
      badgeScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );
      
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 800 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [isNewlyEarned]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value
  }));

  return (
    <View style={styles.achievementContainer}>
      <Animated.View style={[styles.badgeContainer, badgeStyle]}>
        {ageGroup === '10-12' && achievement.rarity !== 'common' && (
          <Animated.View 
            style={[
              styles.badgeGlow, 
              { backgroundColor: rarityColor },
              glowStyle
            ]} 
          />
        )}
        
        <Avatar.Icon
          icon={achievement.icon}
          size={config.diameter}
          style={[
            styles.achievementBadge,
            { backgroundColor: rarityColor }
          ]}
        />
        
        {isNewlyEarned && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW!</Text>
          </View>
        )}
      </Animated.View>
      
      <Text 
        style={[styles.achievementTitle, { fontSize: config.titleSize }]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
    </View>
  );
};
```

### 5. Schedule Timeline Pattern

Educational schedule display with time awareness:

```typescript
// Educational Schedule Timeline
interface ScheduleTimelineProps {
  scheduleItems: TodayScheduleItem[];
  ageGroup: '10-12' | '13-15' | '16-18';
  currentTime: Date;
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  scheduleItems,
  ageGroup,
  currentTime
}) => {
  const getStatusColor = (status: 'upcoming' | 'current' | 'completed') => {
    switch (status) {
      case 'current': return Colors.green500;
      case 'completed': return Colors.grey400;
      default: return Colors.blue500;
    }
  };

  const getStatusIcon = (status: 'upcoming' | 'current' | 'completed') => {
    switch (status) {
      case 'current': return 'play-circle';
      case 'completed': return 'check-circle';
      default: return 'clock';
    }
  };

  return (
    <View style={styles.timeline}>
      {scheduleItems.map((item, index) => (
        <View key={item.id} style={styles.timelineItem}>
          <View style={styles.timelineIndicator}>
            <Avatar.Icon
              icon={getStatusIcon(item.status)}
              size={ageGroup === '10-12' ? 32 : 28}
              style={{
                backgroundColor: getStatusColor(item.status)
              }}
            />
            {index < scheduleItems.length - 1 && (
              <View style={[
                styles.timelineLine,
                { backgroundColor: getStatusColor(item.status) }
              ]} />
            )}
          </View>
          
          <Card style={[
            styles.scheduleCard,
            item.status === 'current' && styles.currentCard
          ]}>
            <Card.Content>
              <View style={styles.scheduleHeader}>
                <Title style={[
                  styles.scheduleTitle,
                  ageGroup === '10-12' && styles.elementaryTitle
                ]}>
                  {item.group_name}
                </Title>
                
                <Chip
                  mode="outlined"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {item.start_time} - {item.end_time}
                </Chip>
              </View>
              
              <Paragraph style={styles.scheduleSubject}>
                {item.subject} • {item.level}
              </Paragraph>
              
              {item.teacher_name && (
                <Caption style={styles.teacherName}>
                  👨‍🏫 {item.teacher_name}
                </Caption>
              )}
            </Card.Content>
          </Card>
        </View>
      ))}
    </View>
  );
};
```

### 6. Task Card Pattern

Quest-style task representation with difficulty indicators:

```typescript
// Educational Task Card (Quest Style)
interface TaskCardProps {
  task: PendingTaskData;
  ageGroup: '10-12' | '13-15' | '16-18';
  onComplete: (taskId: string) => void;
  onProgress: (taskId: string, progress: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  ageGroup,
  onComplete,
  onProgress
}) => {
  const progressAnimation = useSharedValue(task.completion_percentage);

  const getDifficultyStars = (level: string) => {
    const stars = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
    return '⭐'.repeat(stars);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.red500;
      case 'medium': return Colors.orange500;
      default: return Colors.green500;
    }
  };

  const isElementary = ageGroup === '10-12';

  return (
    <Card
      style={[
        styles.taskCard,
        isElementary && styles.questCard
      ]}
      mode={isElementary ? 'elevated' : 'outlined'}
    >
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <Text style={[
              styles.taskTitle,
              isElementary && styles.questTitle
            ]}>
              {isElementary ? `🎯 ${task.title}` : task.title}
            </Text>
            
            <Chip
              icon="flag"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
              textStyle={{ color: 'white' }}
            >
              {task.priority.toUpperCase()}
            </Chip>
          </View>
          
          {isElementary && (
            <Text style={styles.difficultyStars}>
              {getDifficultyStars(task.difficulty_level)}
            </Text>
          )}
        </View>
        
        <Paragraph style={styles.taskDescription}>
          {task.description}
        </Paragraph>
        
        <View style={styles.taskDetails}>
          <View style={styles.taskMeta}>
            <Caption>⏱️ {task.estimated_duration} min</Caption>
            <Caption>🏆 {task.points_reward} points</Caption>
            <Caption>📚 {task.subject}</Caption>
          </View>
          
          <Caption style={styles.dueDate}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Caption>
        </View>
        
        {task.completion_percentage > 0 && (
          <View style={styles.progressSection}>
            <ProgressBar
              progress={task.completion_percentage / 100}
              color={Colors.primary}
              style={styles.taskProgress}
            />
            <Caption>{task.completion_percentage}% complete</Caption>
          </View>
        )}
      </Card.Content>
      
      <Card.Actions>
        {task.completion_percentage < 100 ? (
          <Button
            mode={isElementary ? "contained" : "outlined"}
            onPress={() => onProgress(task.id, Math.min(100, task.completion_percentage + 25))}
          >
            {isElementary ? "Continue Quest" : "Update Progress"}
          </Button>
        ) : (
          <Button
            mode="contained"
            icon="check"
            onPress={() => onComplete(task.id)}
          >
            {isElementary ? "Complete Quest!" : "Mark Complete"}
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
};
```

## Age-Adaptive Styling Patterns

### Elementary Students (10-12 years)

```typescript
const elementaryStyles = StyleSheet.create({
  // Larger, more colorful, gamified elements
  elementaryCard: {
    elevation: 4,
    borderRadius: 16,
    marginVertical: 8,
    backgroundColor: Colors.blue50,
  },
  
  elementaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  
  elementaryCounter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.green600,
  },
  
  questCard: {
    borderWidth: 2,
    borderColor: Colors.amber300,
    backgroundColor: Colors.amber50,
  },
  
  celebrationEmoji: {
    fontSize: 24,
  }
});
```

### Secondary Students (13-18 years)

```typescript
const secondaryStyles = StyleSheet.create({
  // Cleaner, more professional appearance
  secondaryCard: {
    elevation: 2,
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: Colors.grey50,
  },
  
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.grey800,
  },
  
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  metricCard: {
    width: '48%',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 8,
  }
});
```

## Performance Patterns

### 1. Memoization Pattern

```typescript
// Memoized dashboard components
const MemoizedRankingCard = React.memo(RankingCard, (prevProps, nextProps) => {
  return (
    prevProps.ranking.current_rank === nextProps.ranking.current_rank &&
    prevProps.ranking.total_points === nextProps.ranking.total_points &&
    prevProps.ageGroup === nextProps.ageGroup
  );
});

const MemoizedStatsCard = React.memo(QuickStatsCard, (prevProps, nextProps) => {
  return (
    prevProps.stats.current_streak === nextProps.stats.current_streak &&
    prevProps.stats.weekly_points === nextProps.stats.weekly_points
  );
});
```

### 2. Lazy Loading Pattern

```typescript
// Lazy load non-critical components
const LazyAchievementsCard = React.lazy(() => 
  import('../components/RecentAchievementsCard')
);

const LazyTasksCard = React.lazy(() => 
  import('../components/PendingTasksCard')
);

// Usage with Suspense
<Suspense fallback={<ActivityIndicator animating size="large" />}>
  <LazyAchievementsCard {...achievementProps} />
</Suspense>
```

### 3. Virtualized List Pattern

```typescript
// For large achievement lists
const renderAchievement = ({ item }: { item: StudentAchievementData }) => (
  <AchievementBadge 
    achievement={item} 
    ageGroup={ageGroup}
    size="small"
  />
);

<FlatList
  data={achievements}
  renderItem={renderAchievement}
  keyExtractor={(item) => item.id}
  horizontal
  showsHorizontalScrollIndicator={false}
  getItemLayout={(data, index) => ({
    length: 80,
    offset: 80 * index,
    index,
  })}
  maxToRenderPerBatch={5}
  windowSize={10}
/>
```

## Accessibility Patterns

### 1. Screen Reader Support

```typescript
// Comprehensive accessibility labels
const accessibilityLabel = useMemo(() => {
  let label = `${task.title}, ${task.type}`;
  if (task.completion_percentage > 0) {
    label += `, ${task.completion_percentage}% complete`;
  }
  label += `, due ${new Date(task.due_date).toLocaleDateString()}`;
  label += `, ${task.points_reward} points reward`;
  return label;
}, [task]);

<TouchableOpacity
  accessible={true}
  accessibilityLabel={accessibilityLabel}
  accessibilityRole="button"
  accessibilityHint="Tap to view task details and update progress"
>
```

### 2. High Contrast Support

```typescript
// Dynamic contrast adjustment
const getContrastAwareColor = (baseColor: string) => {
  const highContrastMode = useAccessibilityInfo().isHighTextContrastEnabled;
  return highContrastMode ? Colors.grey900 : baseColor;
};
```

## Animation Performance Patterns

### 1. Native Driver Optimization

```typescript
// Always use native driver for transforms
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { scale: withSpring(scale.value, { useNativeDriver: true }) },
    { translateY: withTiming(translateY.value, { useNativeDriver: true }) }
  ],
  opacity: withTiming(opacity.value, { useNativeDriver: true })
}), []);
```

### 2. Reduced Motion Support

```typescript
// Respect reduced motion preferences
const respectsReducedMotion = useAccessibilityInfo().isReduceMotionEnabled;

const animationDuration = respectsReducedMotion ? 0 : 300;
const springConfig = respectsReducedMotion 
  ? { damping: 1000, stiffness: 1000 } 
  : { damping: 15, stiffness: 150 };
```

## Testing Patterns

### 1. Component Testing

```typescript
// Age-specific component testing
describe('EducationalCard', () => {
  it('renders larger elements for elementary age group', () => {
    const { getByTestId } = render(
      <EducationalCard 
        title="Test Card" 
        ageGroup="10-12"
        gamificationEnabled={true}
      />
    );
    
    const title = getByTestId('card-title');
    expect(title).toHaveStyle({ fontSize: 18 });
  });
  
  it('shows progress overlay when gamification enabled', () => {
    const { getByTestId } = render(
      <EducationalCard 
        progress={75}
        gamificationEnabled={true}
        ageGroup="10-12"
      />
    );
    
    expect(getByTestId('progress-overlay')).toBeTruthy();
  });
});
```

## Implementation Guidelines

### 1. Component Structure

1. **Age Detection**: Always check age group at component level
2. **Memoization**: Use React.memo for expensive components
3. **Animation**: Prefer native driver animations
4. **Accessibility**: Include comprehensive accessibility support
5. **Performance**: Implement virtualization for large lists

### 2. Pattern Usage

1. **Educational Cards**: Use for all major content containers
2. **Animated Counters**: For gamification metrics and scores
3. **Progress Rings**: For completion status and goals
4. **Achievement Badges**: For recognition and motivation
5. **Task Cards**: For homework and activity management

### 3. Best Practices

1. **Consistent Spacing**: Use 8px grid system
2. **Color Semantics**: Maintain consistent color meanings
3. **Touch Targets**: Minimum 44pt (48pt+ for elementary)
4. **Loading States**: Always provide loading indicators
5. **Error Boundaries**: Wrap components in error boundaries

## Conclusion

These component patterns provide a comprehensive foundation for building the Harry School Student Dashboard with:

✅ **Age-Appropriate Design**: Dynamic adaptations based on educational psychology  
✅ **Performance Optimization**: Memoization, lazy loading, and native animations  
✅ **Accessibility Compliance**: WCAG 2.1 AA standards with comprehensive support  
✅ **Educational Micro-Animations**: Engaging but purposeful animations  
✅ **Gamification Integration**: Motivational elements without distraction  
✅ **Cultural Sensitivity**: Appropriate for Uzbekistan educational context  

The patterns are based on React Native Paper best practices while incorporating educational-specific enhancements to create an engaging and effective learning dashboard experience.

---

**Implementation Status**: ✅ Complete  
**Documentation Source**: context7 MCP server research on React Native Paper  
**Component Library**: React Native Paper + Educational Extensions  
**Performance Target**: 60fps animations, <2s load times  
**Accessibility Standard**: WCAG 2.1 AA compliance