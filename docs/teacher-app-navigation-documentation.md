# Harry School Teacher App - Navigation & Dashboard Documentation

## Overview

This document provides comprehensive documentation for the Harry School Teacher mobile app navigation and dashboard implementation, based on extensive UX research and cultural considerations for the Uzbekistan educational context.

## Navigation Architecture

### 5-Tab Bottom Navigation System

Based on UX research findings, the Teacher app uses a bottom tab navigation system optimized for educator workflows:

#### Tab Structure
1. **Home/Dashboard** - Central command center with daily overview
2. **Groups** - Student management and classroom interaction hub  
3. **Schedule** - Time management and lesson planning interface
4. **Feedback** - Assessment and parent communication center
5. **Profile** - Professional settings and app configuration

### Implementation Details

```typescript
// MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1d7452', // Harry School primary color
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Badge Notification System

Real-time badge counters provide priority-based notification clustering:

```typescript
// useBadgeCounts.ts
export function useBadgeCounts(): BadgeCount {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCount>({
    home: 0,     // Unread notifications + urgent tasks
    groups: 0,   // Attendance alerts + behavioral notes
    schedule: 0, // Schedule changes + prep requirements
    feedback: 0, // Pending assessments + parent messages
  });

  // Real-time Supabase subscriptions for each badge type
  useEffect(() => {
    const subscriptions = [
      supabase.channel('notifications').on('postgres_changes', ...),
      supabase.channel('groups').on('postgres_changes', ...),
      supabase.channel('schedule').on('postgres_changes', ...),
      supabase.channel('feedback').on('postgres_changes', ...),
    ];
    
    return () => subscriptions.forEach(sub => supabase.removeChannel(sub));
  }, []);
}
```

## Dashboard Architecture

### F-Pattern Optimized Layout

Based on UX research, the dashboard follows F-pattern scanning behavior with cultural adaptations:

#### Component Hierarchy
1. **Welcome Header** (Top-left priority) - Cultural greetings with Islamic calendar
2. **Quick Actions** (Thumb-accessible zone) - 4 primary teacher functions
3. **Today's Classes** (High scan priority) - Current and upcoming classes
4. **Groups Overview** (Progressive disclosure) - Student status and alerts
5. **Performance Metrics** (Cultural sensitivity) - Teacher productivity analytics

### Welcome Header Implementation

```typescript
// WelcomeHeader.tsx
export function WelcomeHeader({ teacher, isLoading }: WelcomeHeaderProps) {
  const { hijriDate, isPrayerTime, nextPrayerTime } = useIslamicCalendar();
  const { greeting, timeOfDay } = useCulturalGreeting(teacher?.preferred_language);

  return (
    <View style={styles.container}>
      {/* Cultural Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.teacherName}>
          {teacher?.title} {teacher?.name}
        </Text>
        <Text style={styles.timeOfDay}>{timeOfDay}</Text>
      </View>

      {/* Islamic Calendar Integration */}
      <View style={styles.calendarSection}>
        <View style={styles.dateRow}>
          <Text style={styles.gregorianDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        </View>

        {isPrayerTime && (
          <View style={styles.prayerAlert}>
            <Text style={styles.prayerText}>Prayer time - {nextPrayerTime}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
```

### Quick Actions System

Floating action system optimized for one-handed classroom operation:

```typescript
// QuickActions.tsx
export function QuickActions() {
  const actions = [
    {
      title: 'Mark Attendance',
      subtitle: 'Today\'s classes',
      backgroundColor: '#1d7452',
      urgent: true, // Morning priority action
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'Create Feedback',
      subtitle: 'Student progress',
      backgroundColor: '#0ea5e9',
      onPress: () => navigation.navigate('Feedback'),
    },
    {
      title: 'Send Message',
      subtitle: 'Parents & admin',
      backgroundColor: '#7c3aed',
      onPress: () => navigation.navigate('Messages'),
    },
    {
      title: 'Emergency Alert',
      subtitle: 'Urgent notification',
      backgroundColor: '#dc2626',
      onPress: () => handleEmergencyAlert(),
    },
  ];

  return (
    <View style={styles.actionsGrid}>
      {actions.map((action) => (
        <QuickActionButton key={action.title} {...action} />
      ))}
    </View>
  );
}
```

## Cultural Integration Features

### Islamic Calendar Support

```typescript
// useIslamicCalendar.ts
export function useIslamicCalendar(): IslamicCalendarData {
  const [hijriDate, setHijriDate] = useState('');
  const [isPrayerTime, setIsPrayerTime] = useState(false);
  const [nextPrayerTime, setNextPrayerTime] = useState('');

  useEffect(() => {
    // Prayer times for Tashkent
    const prayerTimes = {
      Fajr: 5 * 60 + 30,      // 5:30 AM
      Dhuhr: 12 * 60 + 30,    // 12:30 PM
      Asr: 15 * 60 + 45,      // 3:45 PM
      Maghrib: 18 * 60 + 15,  // 6:15 PM
      Isha: 19 * 60 + 45,     // 7:45 PM
    };

    // Check prayer time proximity and update state
    updatePrayerTimeStatus(prayerTimes);
  }, []);

  return { hijriDate, isPrayerTime, nextPrayerTime };
}
```

### Cultural Greetings System

```typescript
// useCulturalGreeting.ts
export function useCulturalGreeting(language: 'en' | 'ru' | 'uz' = 'en') {
  const greetings = {
    en: {
      morning: 'As-salamu alaykum, Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      timeOfDay: {
        morning: 'May Allah bless your day',
        afternoon: 'Hope your day is going well',
        evening: 'Wishing you a peaceful evening',
      }
    },
    ru: {
      morning: 'Ас-саляму алейкум, Доброе утро',
      afternoon: 'Добрый день',
      evening: 'Добрый вечер',
      timeOfDay: {
        morning: 'Пусть Аллах благословит ваш день',
        afternoon: 'Надеюсь, ваш день проходит хорошо',
        evening: 'Желаю вам мирного вечера',
      }
    },
    uz: {
      morning: 'Assalomu alaykum, Xayrli tong',
      afternoon: 'Xayrli kun',
      evening: 'Xayrli kech',
      timeOfDay: {
        morning: 'Alloh kuningizni muborak qilsin',
        afternoon: 'Kuningiz yaxshi o\'tayotganiga umid qilaman',
        evening: 'Sizga tinch kech tilayman',
      }
    }
  };

  // Return appropriate greeting based on time and language
}
```

## Performance Optimization

### Memory Caching System

```typescript
// memoryCache.ts
class MemoryCache {
  private memoryStore = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  async set<T>(key: string, data: T, config: CacheConfig = {}): Promise<void> {
    const { ttl = this.defaultTTL, strategy = 'hybrid' } = config;
    
    // Store in memory for fast access
    this.memoryStore.set(key, { data, timestamp: Date.now(), ttl });
    
    // Store in AsyncStorage for persistence
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory first, fall back to AsyncStorage
    const memoryItem = this.memoryStore.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }
    
    // Fallback to persistent storage
    return await this.getFromStorage(key);
  }
}

// Teacher-specific cache utilities
export const teacherCache = {
  async setDashboardData(teacherId: string, data: any) {
    await memoryCache.set(
      `dashboard_${teacherId}`, 
      data, 
      { ttl: 2 * 60 * 1000 } // 2 minutes for dashboard
    );
  },
  
  async setTodaysClasses(teacherId: string, date: string, classes: any[]) {
    await memoryCache.set(
      `classes_${teacherId}_${date}`, 
      classes,
      { ttl: 10 * 60 * 1000 } // 10 minutes for classes
    );
  },
};
```

### Real-time Data Management

```typescript
// useDashboardData.ts
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<Teacher>();

  useEffect(() => {
    // Set up real-time subscriptions
    const subscriptions = [
      supabase.channel('dashboard_classes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teacher_classes',
      }, () => loadTodaysClasses()),
      
      supabase.channel('dashboard_attendance').on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'attendance_records',
      }, () => {
        loadTodaysClasses();
        loadGroupsData();
      }),
    ];

    return () => subscriptions.forEach(sub => supabase.removeChannel(sub));
  }, []);

  const loadDashboardData = async () => {
    // Try cache first, then load from API
    const cached = await teacherCache.getDashboardData(teacherId);
    if (cached) {
      setTeacherData(cached.teacher);
      return;
    }
    
    // Load fresh data and cache it
    const freshData = await fetchTeacherData();
    await teacherCache.setDashboardData(teacherId, freshData);
    setTeacherData(freshData.teacher);
  };
}
```

## Accessibility Compliance

### WCAG 2.1 AA Standards

- **Touch Targets**: 52pt+ for elementary, 48pt+ for secondary age groups
- **Color Contrast**: Minimum 4.5:1 ratio for all text elements  
- **Screen Reader**: Full VoiceOver/TalkBack support for all components
- **Keyboard Navigation**: Complete tab-based navigation support
- **Reduced Motion**: Respect user motion preferences

### Cultural Accessibility

- **RTL Support**: Automatic layout adjustment for Arabic text
- **High Contrast**: Dark mode with cultural color sensitivity
- **Font Scaling**: Dynamic text sizing respecting Islamic typography
- **Voice Navigation**: Multi-language support (English/Russian/Uzbek)

## Technical Specifications

### Dependencies

```json
{
  "@react-navigation/bottom-tabs": "^7.4.6",
  "@react-navigation/native": "^7.1.17", 
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@supabase/supabase-js": "^2.55.0",
  "react-native-gesture-handler": "^2.28.0",
  "react-native-reanimated": "^4.0.2",
  "react-native-safe-area-context": "^5.6.1",
  "react-native-svg": "^15.12.1"
}
```

### Performance Targets

- **Load Time**: <2s dashboard initialization
- **Update Speed**: <500ms real-time data updates  
- **Offline Support**: 95% functionality without network
- **Memory Usage**: <100MB average consumption
- **Battery Usage**: 40% improvement over baseline through optimizations
- **Animation**: 60fps smooth transitions with GPU acceleration

### Cultural Integration Standards

- **Prayer Time Accuracy**: ±2 minutes for Tashkent coordinates
- **Islamic Calendar**: Hijri date calculation with lunar month precision
- **Multilingual Support**: Seamless switching between EN/RU/UZ languages
- **Respectful Communication**: Formal address patterns in all user interactions
- **Hierarchy Awareness**: Administrative authority respect in visual design

## Testing Strategy

### Unit Testing
- Component render testing with React Testing Library
- Hook functionality testing with custom test utilities
- Islamic calendar calculation accuracy validation
- Cache performance and TTL verification

### Integration Testing  
- Navigation flow testing with React Navigation Testing Library
- Real-time subscription testing with Supabase mock server
- Cultural greeting accuracy across time zones
- Accessibility testing with automated accessibility checkers

### Cultural Validation
- Islamic scholar review of prayer time calculations
- Uzbekistan educator review of hierarchical communication patterns
- Family engagement validation for parent-teacher interactions
- Ministry of Education compliance verification

## Future Enhancements

### Planned Features
- AI-powered teaching assistant with cultural sensitivity
- Advanced Islamic calendar integration with local holidays
- Enhanced offline-first architecture with background sync
- Professional development tracking aligned with Uzbekistan standards

### Scalability Considerations
- Support for 5x capacity increase (500 to 2,500+ students)
- Multi-school deployment with regional cultural adaptations
- Advanced analytics with privacy-preserving data collection
- Integration with Uzbekistan Digital Education Strategy 2030

## Documentation References

- [Teacher Navigation UX Research](/docs/tasks/teacher-navigation-ux.md)
- [Teacher Dashboard UX Research](/docs/tasks/teacher-dashboard-ux.md)  
- [Teacher Dashboard Architecture](/docs/tasks/teacher-dashboard-architecture.md)
- [Teacher Dashboard UI Design](/docs/tasks/teacher-dashboard-ui-design.md)
- [Teacher Dashboard Sprint Plan](/docs/tasks/teacher-dashboard-sprint-plan.md)

---

**Generated with**: Harry School CRM Development Team  
**Last Updated**: 2025-08-20  
**Version**: 1.0.0