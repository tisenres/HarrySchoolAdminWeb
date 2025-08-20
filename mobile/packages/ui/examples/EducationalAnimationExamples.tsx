/**
 * Educational Animation Examples - Harry School Design System
 * 
 * Comprehensive examples demonstrating educational micro-interactions
 * organized by user type (Teacher vs Student) and use case
 */

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  AnimatedButton,
  VocabularyCard,
  AttendanceButton,
  AchievementBadge,
  PointsCounter,
  LoadingSpinner,
  QuickActionButton,
  ProgressBar,
  Text,
} from '../components';
import { colors } from '../theme/colors';

export const EducationalAnimationExamples: React.FC = () => {
  // Example state management
  const [attendance, setAttendance] = useState<Record<string, any>>({});
  const [points, setPoints] = useState(1250);
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(65);

  // Teacher efficiency examples
  const TeacherExamples = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👩‍🏫 Teacher Efficiency Animations</Text>
      <Text style={styles.sectionDescription}>
        Ultra-fast animations (100-150ms) optimized for rapid workflows
      </Text>
      
      {/* Quick Attendance Marking */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Quick Attendance Marking</Text>
        <View style={styles.attendanceGrid}>
          {['Alice', 'Bob', 'Carol', 'David'].map((name, index) => (
            <AttendanceButton
              key={`student-${index}`}
              studentId={`student-${index}`}
              studentName={name}
              currentStatus={attendance[`student-${index}`] || null}
              onStatusChange={(id, status) => {
                setAttendance(prev => ({ ...prev, [id]: status }));
              }}
              size="small"
              style={styles.attendanceButton}
            />
          ))}
        </View>
      </View>
      
      {/* Quick Action Buttons */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickActionButton
            action="approve"
            onPress={() => console.log('Approved')}
            size="small"
            variant="primary"
          />
          <QuickActionButton
            action="edit"
            onPress={() => console.log('Edit')}
            size="small"
            variant="secondary"
          />
          <QuickActionButton
            action="send"
            onPress={() => console.log('Send')}
            size="small"
            loading={loading}
            variant="primary"
            batchMode
            batchCount={5}
          />
          <QuickActionButton
            action="delete"
            onPress={() => console.log('Delete')}
            size="small"
            variant="ghost"
          />
        </View>
      </View>
      
      {/* Efficient Loading States */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Teacher-Optimized Loading</Text>
        <View style={styles.loadingRow}>
          <LoadingSpinner
            context="teacher"
            variant="minimal"
            size="small"
            message="Saving..."
          />
          <LoadingSpinner
            context="teacher"
            variant="dots"
            size="small"
          />
        </View>
      </View>
    </View>
  );

  // Student engagement examples
  const StudentExamples = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎓 Student Engagement Animations</Text>
      <Text style={styles.sectionDescription}>
        Delightful celebrations and progress animations to motivate learning
      </Text>
      
      {/* Vocabulary Learning */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Interactive Vocabulary Cards</Text>
        <View style={styles.cardRow}>
          <VocabularyCard
            word="Adventure"
            translation="Sarguzasht"
            pronunciation="əd-ˈven-chər"
            definition="An exciting or remarkable experience"
            example="We went on an adventure in the mountains"
            exampleTranslation="Biz tog'larda sarguzashtga chiqdik"
            difficulty="medium"
            hasAudio
            onPlayAudio={() => console.log('Playing audio')}
            onWordLearned={() => console.log('Word learned')}
            size="medium"
          />
          <VocabularyCard
            word="Brilliant"
            translation="Zo'r"
            pronunciation="ˈbrɪl.jənt"
            difficulty="easy"
            isLearned
            size="medium"
          />
        </View>
      </View>
      
      {/* Achievement System */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Achievement Celebrations</Text>
        <View style={styles.achievementRow}>
          <AchievementBadge
            type="streak"
            title="7-Day Streak"
            description="Learn every day"
            isUnlocked={true}
            isNew={true}
            size="medium"
            celebrationLevel="standard"
          />
          <AchievementBadge
            type="perfect"
            title="Perfect Score"
            description="100% correct"
            isUnlocked={true}
            size="medium"
            celebrationLevel="dramatic"
            triggerUnlock={achievements.perfect}
            onUnlockComplete={() => setAchievements(prev => ({ ...prev, perfect: false }))}
          />
          <AchievementBadge
            type="vocabulary"
            title="Word Master"
            description="50 words learned"
            isUnlocked={false}
            progress={78}
            size="medium"
          />
          <AchievementBadge
            type="first_time"
            title="First Lesson"
            description="Welcome!"
            isUnlocked={true}
            size="medium"
            celebrationLevel="dramatic"
          />
        </View>
      </View>
      
      {/* Points and Progress */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Points & Progress Tracking</Text>
        <View style={styles.pointsRow}>
          <PointsCounter
            currentPoints={points}
            previousPoints={points - 50}
            maxPoints={2000}
            variant="celebration"
            celebrateOnIncrease
            showStreakMultiplier
            streakMultiplier={2}
            size="medium"
          />
          <AnimatedButton
            title="Earn +50 Points"
            variant="success"
            onPress={() => setPoints(prev => prev + 50)}
            hapticType="medium"
          />
        </View>
      </View>
      
      {/* Lesson Progress */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Lesson Progress Animation</Text>
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={lessonProgress}
            variant="success"
            showLabel
            label="Lesson 3: Family Vocabulary"
            showPercentage
            style={styles.progressBar}
          />
          <View style={styles.progressButtons}>
            <AnimatedButton
              title="+10%"
              size="small"
              onPress={() => setLessonProgress(Math.min(100, lessonProgress + 10))}
            />
            <AnimatedButton
              title="Reset"
              size="small"
              variant="secondary"
              onPress={() => setLessonProgress(0)}
            />
          </View>
        </View>
      </View>
      
      {/* Student Loading States */}
      <View style={styles.exampleGroup}>
        <Text style={styles.exampleTitle}>Engaging Loading States</Text>
        <View style={styles.loadingRow}>
          <LoadingSpinner
            context="student"
            variant="books"
            size="medium"
            message="Preparing your lesson..."
          />
          <LoadingSpinner
            context="student"
            variant="star"
            size="medium"
            message="Calculating points..."
          />
          <LoadingSpinner
            context="student"
            variant="brain"
            size="medium"
            message="AI is thinking..."
          />
        </View>
      </View>
    </View>
  );

  // Demo Controls
  const DemoControls = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎮 Demo Controls</Text>
      <View style={styles.controlsRow}>
        <AnimatedButton
          title="Trigger Loading"
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
          variant="primary"
          size="small"
        />
        <AnimatedButton
          title="Perfect Score!"
          onPress={() => setAchievements(prev => ({ ...prev, perfect: true }))}
          variant="success"
          size="small"
        />
        <AnimatedButton
          title="Reset Demo"
          onPress={() => {
            setAttendance({});
            setPoints(1250);
            setAchievements({});
            setLessonProgress(65);
          }}
          variant="secondary"
          size="small"
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Educational Micro-Interactions</Text>
        <Text style={styles.subtitle}>
          Delightful animations optimized for teachers and students
        </Text>
      </View>
      
      <TeacherExamples />
      <StudentExamples />
      <DemoControls />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Harry School Design System • Educational Animations
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  exampleGroup: {
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 12,
  },
  attendanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attendanceButton: {
    marginRight: 12,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressContainer: {
    gap: 12,
  },
  progressBar: {
    width: '100%',
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default EducationalAnimationExamples;