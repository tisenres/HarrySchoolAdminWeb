import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  points: number;
  isCompleted: boolean;
  isLocked: boolean;
  progress: number;
}

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Present Simple Tense',
    description: 'Learn the basics of present simple tense with interactive exercises',
    type: 'text',
    difficulty: 'beginner',
    duration: 25,
    points: 100,
    isCompleted: true,
    isLocked: false,
    progress: 100,
  },
  {
    id: '2',
    title: 'Vocabulary Quiz: Daily Routines',
    description: 'Test your knowledge of daily routine vocabulary',
    type: 'quiz',
    difficulty: 'beginner',
    duration: 15,
    points: 150,
    isCompleted: true,
    isLocked: false,
    progress: 100,
  },
  {
    id: '3',
    title: 'Speaking Practice: Introductions',
    description: 'Practice introducing yourself with AI feedback',
    type: 'speaking',
    difficulty: 'intermediate',
    duration: 20,
    points: 200,
    isCompleted: false,
    isLocked: false,
    progress: 60,
  },
  {
    id: '4',
    title: 'Listening: Restaurant Conversation',
    description: 'Listen to a restaurant conversation and answer questions',
    type: 'listening',
    difficulty: 'intermediate',
    duration: 30,
    points: 250,
    isCompleted: false,
    isLocked: false,
    progress: 0,
  },
  {
    id: '5',
    title: 'Writing: My Favorite Hobby',
    description: 'Write a short essay about your favorite hobby',
    type: 'writing',
    difficulty: 'advanced',
    duration: 40,
    points: 300,
    isCompleted: false,
    isLocked: true,
    progress: 0,
  },
];

const getLessonTypeIcon = (type: string) => {
  switch (type) {
    case 'text': return 'book';
    case 'quiz': return 'help-circle';
    case 'speaking': return 'mic';
    case 'listening': return 'headset';
    case 'writing': return 'create';
    default: return 'book';
  }
};

const getLessonTypeColor = (type: string) => {
  switch (type) {
    case 'text': return COLORS.primary;
    case 'quiz': return COLORS.warning;
    case 'speaking': return COLORS.error;
    case 'listening': return COLORS.info;
    case 'writing': return COLORS.purple;
    default: return COLORS.primary;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return COLORS.success;
    case 'intermediate': return COLORS.warning;
    case 'advanced': return COLORS.error;
    default: return COLORS.success;
  }
};

export default function LessonsListScreen() {
  const completedLessons = mockLessons.filter(l => l.isCompleted).length;
  const totalPoints = mockLessons.filter(l => l.isCompleted).reduce((sum, l) => sum + l.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerCard}
        >
          <Text style={styles.headerTitle}>Your Learning Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedLessons}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockLessons.length}</Text>
              <Text style={styles.statLabel}>Total Lessons</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(completedLessons / mockLessons.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((completedLessons / mockLessons.length) * 100)}% Complete
            </Text>
          </View>
        </LinearGradient>

        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          <Text style={styles.sectionTitle}>Available Lessons</Text>
          
          {mockLessons.map((lesson, index) => {
            const typeColor = getLessonTypeColor(lesson.type);
            const difficultyColor = getDifficultyColor(lesson.difficulty);
            
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  lesson.isLocked && styles.lockedCard
                ]}
                disabled={lesson.isLocked}
                activeOpacity={0.7}
              >
                <View style={styles.lessonHeader}>
                  <View style={[styles.lessonTypeIcon, { backgroundColor: `${typeColor}20` }]}>
                    <Ionicons 
                      name={getLessonTypeIcon(lesson.type) as any} 
                      size={24} 
                      color={lesson.isLocked ? COLORS.gray400 : typeColor}
                    />
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={[
                      styles.lessonTitle,
                      lesson.isLocked && styles.lockedText
                    ]}>
                      {lesson.title}
                    </Text>
                    <Text style={[
                      styles.lessonDescription,
                      lesson.isLocked && styles.lockedDescription
                    ]}>
                      {lesson.description}
                    </Text>
                  </View>
                  
                  <View style={styles.lessonStatus}>
                    {lesson.isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                      </View>
                    ) : lesson.isLocked ? (
                      <Ionicons name="lock-closed" size={20} color={COLORS.gray400} />
                    ) : lesson.progress > 0 ? (
                      <View style={styles.progressIndicator}>
                        <Text style={styles.progressPercentage}>{lesson.progress}%</Text>
                      </View>
                    ) : (
                      <Ionicons name="play-circle" size={24} color={typeColor} />
                    )}
                  </View>
                </View>
                
                <View style={styles.lessonFooter}>
                  <View style={styles.lessonMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{lesson.duration} min</Text>
                    </View>
                    
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={14} color={COLORS.gold} />
                      <Text style={styles.metaText}>{lesson.points} pts</Text>
                    </View>
                    
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: `${difficultyColor}20` }
                    ]}>
                      <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                        {lesson.difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  {!lesson.isCompleted && !lesson.isLocked && lesson.progress > 0 && (
                    <View style={styles.lessonProgressBar}>
                      <View 
                        style={[
                          styles.lessonProgressFill,
                          { 
                            width: `${lesson.progress}%`,
                            backgroundColor: typeColor 
                          }
                        ]}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  headerCard: {
    margin: SPACING.base,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressSection: {
    marginTop: SPACING.base,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Lessons
  lessonsContainer: {
    padding: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  lessonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  lockedCard: {
    opacity: 0.6,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
  },
  lessonTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lockedText: {
    color: COLORS.gray500,
  },
  lessonDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  lockedDescription: {
    color: COLORS.gray400,
  },
  lessonStatus: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  completedBadge: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  lessonFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  metaText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
    textTransform: 'capitalize',
  },
  lessonProgressBar: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});