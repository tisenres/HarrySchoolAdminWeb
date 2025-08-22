import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  background: '#f8fafc',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export default function LessonsScreen() {
  const lessons = [
    { id: 1, title: 'Arabic Grammar - Lesson 15', progress: 85, type: 'text', points: 25 },
    { id: 2, title: 'Islamic History Quiz', progress: 0, type: 'quiz', points: 40 },
    { id: 3, title: 'Quran Recitation Practice', progress: 60, type: 'speaking', points: 30 },
    { id: 4, title: 'Math Problem Solving', progress: 100, type: 'mixed', points: 35 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📚 Home Tasks</Text>
        <Text style={styles.subtitle}>Continue your learning journey</Text>
        
        {lessons.map(lesson => (
          <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonPoints}>+{lesson.points} pts</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${lesson.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{lesson.progress}%</Text>
            </View>
            <View style={styles.lessonFooter}>
              <Text style={styles.lessonType}>{lesson.type.toUpperCase()}</Text>
              <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>
                  {lesson.progress === 0 ? 'Start' : lesson.progress === 100 ? 'Review' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  lessonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  lessonPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    backgroundColor: `${COLORS.textSecondary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});