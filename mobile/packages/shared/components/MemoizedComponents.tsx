import React, { memo, forwardRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TouchableOpacityProps,
  ScrollViewProps,
  ImageProps,
  ViewProps,
  TextProps,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useEducationalMemo, useEnhancedCallback } from '../hooks/useMemoization';

// Enhanced memo wrapper with cultural context
function createMemoizedComponent<T extends object>(
  Component: React.ComponentType<T>,
  displayName: string,
  options?: {
    culturalContext?: 'student' | 'teacher' | 'admin';
    respectPrayerTime?: boolean;
    deepComparison?: boolean;
    propsToCompare?: (keyof T)[];
  }
) {
  const {
    culturalContext = 'student',
    respectPrayerTime = true,
    deepComparison = false,
    propsToCompare,
  } = options || {};

  const MemoizedComponent = memo<T>(
    Component,
    (prevProps, nextProps) => {
      // Prayer time optimization - reduce re-renders during prayer
      if (respectPrayerTime) {
        const hour = new Date().getHours();
        if ([5, 12, 15, 18, 20].includes(hour)) {
          // During prayer time, only re-render for critical props
          if (propsToCompare) {
            return propsToCompare.every(prop => prevProps[prop] === nextProps[prop]);
          }
          return true; // Skip re-render during prayer
        }
      }

      // Deep comparison if enabled
      if (deepComparison) {
        return JSON.stringify(prevProps) === JSON.stringify(nextProps);
      }

      // Specific props comparison
      if (propsToCompare) {
        return propsToCompare.every(prop => prevProps[prop] === nextProps[prop]);
      }

      // Default shallow comparison
      return Object.keys(prevProps as object).every(
        key => (prevProps as any)[key] === (nextProps as any)[key]
      );
    }
  );

  MemoizedComponent.displayName = displayName;
  return MemoizedComponent;
}

// Memoized View component with cultural styling
interface MemoizedViewProps extends ViewProps {
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  respectPrayerTime?: boolean;
}

export const MemoizedView = memo<MemoizedViewProps>(
  forwardRef<View, MemoizedViewProps>(({ 
    style, 
    culturalTheme = 'modern', 
    respectPrayerTime = true,
    ...props 
  }, ref) => {
    const culturalStyle = useEducationalMemo(() => {
      const baseColors = {
        islamic: { backgroundColor: '#f0f9f0', borderColor: '#1d7452' },
        educational: { backgroundColor: '#f0f4ff', borderColor: '#2563eb' },
        modern: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
      };
      return baseColors[culturalTheme];
    }, [culturalTheme], culturalTheme === 'islamic' ? 'teacher' : 'student');

    const combinedStyle = useMemo(() => 
      Array.isArray(style) ? [...style, culturalStyle] : [style, culturalStyle],
      [style, culturalStyle]
    );

    return <View ref={ref} style={combinedStyle} {...props} />;
  })
);

MemoizedView.displayName = 'MemoizedView';

// Memoized Text component with cultural typography
interface MemoizedTextProps extends TextProps {
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  language?: 'en' | 'uz' | 'ru' | 'ar';
  respectPrayerTime?: boolean;
}

export const MemoizedText = memo<MemoizedTextProps>(({ 
  style, 
  culturalTheme = 'modern', 
  language = 'en',
  respectPrayerTime = true,
  children,
  ...props 
}) => {
  const culturalTextStyle = useEducationalMemo(() => {
    const baseTextStyles = {
      islamic: { 
        color: '#1d7452', 
        fontFamily: language === 'ar' ? 'Amiri' : 'System',
        fontSize: language === 'ar' ? 18 : 16,
        textAlign: language === 'ar' ? 'right' : 'left',
      },
      educational: { 
        color: '#2563eb', 
        fontFamily: 'System',
        fontSize: 16,
        fontWeight: '500',
      },
      modern: { 
        color: '#374151', 
        fontFamily: 'System',
        fontSize: 16,
      },
    } as const;

    return baseTextStyles[culturalTheme];
  }, [culturalTheme, language], culturalTheme === 'islamic' ? 'teacher' : 'student');

  const combinedStyle = useMemo(() => 
    Array.isArray(style) ? [...style, culturalTextStyle] : [style, culturalTextStyle],
    [style, culturalTextStyle]
  );

  return <Text style={combinedStyle} {...props}>{children}</Text>;
});

MemoizedText.displayName = 'MemoizedText';

// Memoized TouchableOpacity with performance optimization
interface MemoizedTouchableOpacityProps extends TouchableOpacityProps {
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  respectPrayerTime?: boolean;
  debounceMs?: number;
}

export const MemoizedTouchableOpacity = memo<MemoizedTouchableOpacityProps>(({ 
  style,
  onPress,
  culturalTheme = 'modern',
  respectPrayerTime = true,
  debounceMs = 300,
  children,
  ...props 
}) => {
  const culturalStyle = useEducationalMemo(() => {
    const baseButtonStyles = {
      islamic: { 
        backgroundColor: '#1d7452',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      educational: { 
        backgroundColor: '#2563eb',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
      modern: { 
        backgroundColor: '#6b7280',
        borderRadius: 6,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
    };
    return baseButtonStyles[culturalTheme];
  }, [culturalTheme], culturalTheme === 'islamic' ? 'teacher' : 'student');

  const optimizedOnPress = useEnhancedCallback(
    onPress || (() => {}),
    [onPress],
    { 
      debounceMs,
      respectPrayerTime,
      enableAsyncOptimization: true,
    }
  );

  const combinedStyle = useMemo(() => 
    Array.isArray(style) ? [...style, culturalStyle] : [style, culturalStyle],
    [style, culturalStyle]
  );

  return (
    <TouchableOpacity 
      style={combinedStyle} 
      onPress={optimizedOnPress}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
});

MemoizedTouchableOpacity.displayName = 'MemoizedTouchableOpacity';

// Memoized ScrollView with performance optimizations
interface MemoizedScrollViewProps extends ScrollViewProps {
  culturalTheme?: 'islamic' | 'modern' | 'educational';
  respectPrayerTime?: boolean;
  enableOptimization?: boolean;
}

export const MemoizedScrollView = memo<MemoizedScrollViewProps>(
  forwardRef<ScrollView, MemoizedScrollViewProps>(({ 
    style,
    culturalTheme = 'modern',
    respectPrayerTime = true,
    enableOptimization = true,
    children,
    ...props 
  }, ref) => {
    const culturalStyle = useEducationalMemo(() => {
      const baseScrollStyles = {
        islamic: { backgroundColor: '#f0f9f0' },
        educational: { backgroundColor: '#f0f4ff' },
        modern: { backgroundColor: '#ffffff' },
      };
      return baseScrollStyles[culturalTheme];
    }, [culturalTheme], culturalTheme === 'islamic' ? 'teacher' : 'student');

    const optimizationProps = useMemo(() => {
      if (!enableOptimization) return {};

      // Prayer time optimizations
      const isPrayerTime = respectPrayerTime && (() => {
        const hour = new Date().getHours();
        return [5, 12, 15, 18, 20].includes(hour);
      })();

      return {
        removeClippedSubviews: true,
        scrollEventThrottle: isPrayerTime ? 32 : 16, // Slower during prayer
        decelerationRate: isPrayerTime ? 'normal' : 'fast',
        showsVerticalScrollIndicator: !isPrayerTime, // Hide during prayer for simplicity
        showsHorizontalScrollIndicator: !isPrayerTime,
      };
    }, [enableOptimization, respectPrayerTime]);

    const combinedStyle = useMemo(() => 
      Array.isArray(style) ? [...style, culturalStyle] : [style, culturalStyle],
      [style, culturalStyle]
    );

    return (
      <ScrollView 
        ref={ref}
        style={combinedStyle}
        {...optimizationProps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  })
);

MemoizedScrollView.displayName = 'MemoizedScrollView';

// Educational-specific memoized components
export const StudentCard = memo<{
  student: { id: string; name: string; grade?: string; avatar?: string };
  onPress?: (student: any) => void;
  culturalTheme?: 'islamic' | 'modern' | 'educational';
}>(({ student, onPress, culturalTheme = 'educational' }) => {
  const handlePress = useEnhancedCallback(
    () => onPress?.(student),
    [onPress, student],
    { debounceMs: 300, respectPrayerTime: true }
  );

  const cardStyle = useEducationalMemo(() => ({
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: culturalTheme === 'islamic' ? 8 : 12,
    backgroundColor: culturalTheme === 'islamic' ? '#f0f9f0' : '#f0f4ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }), [culturalTheme], 'student');

  return (
    <MemoizedTouchableOpacity 
      style={cardStyle} 
      onPress={handlePress}
      culturalTheme={culturalTheme}
    >
      <MemoizedView style={styles.studentCardContent}>
        {student.avatar && (
          <Image source={{ uri: student.avatar }} style={styles.studentAvatar} />
        )}
        <MemoizedView style={styles.studentInfo}>
          <MemoizedText 
            style={styles.studentName}
            culturalTheme={culturalTheme}
          >
            {student.name}
          </MemoizedText>
          {student.grade && (
            <MemoizedText 
              style={styles.studentGrade}
              culturalTheme={culturalTheme}
            >
              Grade: {student.grade}
            </MemoizedText>
          )}
        </MemoizedView>
      </MemoizedView>
    </MemoizedTouchableOpacity>
  );
});

StudentCard.displayName = 'StudentCard';

export const TeacherCard = memo<{
  teacher: { id: string; name: string; subject?: string; avatar?: string };
  onPress?: (teacher: any) => void;
}>(({ teacher, onPress }) => {
  const handlePress = useEnhancedCallback(
    () => onPress?.(teacher),
    [onPress, teacher],
    { debounceMs: 500, respectPrayerTime: true } // Slower for teachers (respect authority)
  );

  const cardStyle = useEducationalMemo(() => ({
    padding: 18,
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 4,
    borderLeftColor: '#1d7452',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }), [], 'teacher');

  return (
    <MemoizedTouchableOpacity 
      style={cardStyle} 
      onPress={handlePress}
      culturalTheme="islamic"
    >
      <MemoizedView style={styles.teacherCardContent}>
        {teacher.avatar && (
          <Image source={{ uri: teacher.avatar }} style={styles.teacherAvatar} />
        )}
        <MemoizedView style={styles.teacherInfo}>
          <MemoizedText 
            style={styles.teacherName}
            culturalTheme="islamic"
          >
            {teacher.name}
          </MemoizedText>
          {teacher.subject && (
            <MemoizedText 
              style={styles.teacherSubject}
              culturalTheme="islamic"
            >
              Subject: {teacher.subject}
            </MemoizedText>
          )}
        </MemoizedView>
      </MemoizedView>
    </MemoizedTouchableOpacity>
  );
});

TeacherCard.displayName = 'TeacherCard';

export const LessonCard = memo<{
  lesson: { id: string; title: string; duration?: number; difficulty?: string };
  onPress?: (lesson: any) => void;
}>(({ lesson, onPress }) => {
  const handlePress = useEnhancedCallback(
    () => onPress?.(lesson),
    [onPress, lesson],
    { debounceMs: 200, respectPrayerTime: true }
  );

  const difficultyColor = useEducationalMemo(() => {
    const colors = {
      easy: '#22c55e',
      medium: '#f59e0b',
      hard: '#ef4444',
    };
    return colors[lesson.difficulty as keyof typeof colors] || '#6b7280';
  }, [lesson.difficulty], 'student');

  return (
    <MemoizedTouchableOpacity 
      style={styles.lessonCard} 
      onPress={handlePress}
      culturalTheme="educational"
    >
      <MemoizedView style={styles.lessonHeader}>
        <MemoizedText 
          style={styles.lessonTitle}
          culturalTheme="educational"
        >
          {lesson.title}
        </MemoizedText>
        {lesson.difficulty && (
          <MemoizedView 
            style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}
          >
            <MemoizedText style={styles.difficultyText}>
              {lesson.difficulty}
            </MemoizedText>
          </MemoizedView>
        )}
      </MemoizedView>
      {lesson.duration && (
        <MemoizedText 
          style={styles.lessonDuration}
          culturalTheme="educational"
        >
          Duration: {lesson.duration} minutes
        </MemoizedText>
      )}
    </MemoizedTouchableOpacity>
  );
});

LessonCard.displayName = 'LessonCard';

// Animated components with memoization
export const MemoizedAnimatedView = memo(Animated.View);
export const MemoizedAnimatedText = memo(Animated.Text);
export const MemoizedAnimatedScrollView = memo(Animated.ScrollView);

MemoizedAnimatedView.displayName = 'MemoizedAnimatedView';
MemoizedAnimatedText.displayName = 'MemoizedAnimatedText';
MemoizedAnimatedScrollView.displayName = 'MemoizedAnimatedScrollView';

const styles = StyleSheet.create({
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentGrade: {
    fontSize: 14,
    opacity: 0.7,
  },
  teacherCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  teacherSubject: {
    fontSize: 14,
    opacity: 0.8,
  },
  lessonCard: {
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  lessonDuration: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default {
  MemoizedView,
  MemoizedText,
  MemoizedTouchableOpacity,
  MemoizedScrollView,
  StudentCard,
  TeacherCard,
  LessonCard,
  MemoizedAnimatedView,
  MemoizedAnimatedText,
  MemoizedAnimatedScrollView,
};